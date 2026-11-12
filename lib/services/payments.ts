// Payments. Real mode uses Razorpay (REST API, no SDK). Demo mode is clearly labelled and never reported as a real payment.
import crypto from 'node:crypto';
import { Db } from '../db';
import { ApiError } from '../validate';
import { safeEqual } from '../password';
import { markBookingPaid } from './bookings';
import { markOrderPaid } from './orders';

export type PayMode = 'razorpay' | 'demo' | 'disabled';
export const payMode = (): PayMode =>
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? 'razorpay' : process.env.ALLOW_DEMO_PAYMENTS === 'false' ? 'disabled' : 'demo';

const RZP = 'https://api.razorpay.com/v1';
const auth = () => 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
const hmac = (secret: string, data: string | Buffer) => crypto.createHmac('sha256', secret).update(data).digest('hex');

export interface Intent { paymentId: number; mode: 'razorpay' | 'demo'; amountPaise: number; currency: 'INR'; razorpayOrderId?: string; keyId?: string }

export async function createIntent(db: Db, a: { purpose: 'booking' | 'order'; refId: number; userId: number; amountPaise: number; receipt: string }, f: typeof fetch = fetch, now = Date.now()): Promise<Intent> {
  const mode = payMode();
  if (mode === 'disabled') throw new ApiError(503, 'Online payments are not configured yet. Please contact the restaurant.');
  let providerOrderId: string | null = null;
  if (mode === 'razorpay') {
    const r = await f(`${RZP}/orders`, { method: 'POST', headers: { Authorization: auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: a.amountPaise, currency: 'INR', receipt: a.receipt.slice(0, 40), notes: { purpose: a.purpose, ref: String(a.refId) } }) });
    if (!r.ok) { console.error('[razorpay] order create failed', r.status, await r.text().catch(() => '')); throw new ApiError(502, 'The payment provider could not start the payment. Please try again.'); }
    providerOrderId = (await r.json()).id;
  }
  const row = db.prepare(`INSERT INTO payments (purpose, ref_id, user_id, provider, provider_order_id, amount_paise, status, created_at) VALUES (?,?,?,?,?,?, 'created', ?)`)
    .run(a.purpose, a.refId, a.userId, mode, providerOrderId, a.amountPaise, new Date(now).toISOString());
  return { paymentId: Number(row.lastInsertRowid), mode, amountPaise: a.amountPaise, currency: 'INR', razorpayOrderId: providerOrderId ?? undefined, keyId: mode === 'razorpay' ? process.env.RAZORPAY_KEY_ID : undefined };
}

function apply(db: Db, p: any, demo: boolean) {
  return p.purpose === 'booking' ? markBookingPaid(db, p.ref_id, demo) : markOrderPaid(db, p.ref_id, demo);
}

/** Browser reports success -> we verify the signature AND ask Razorpay for the payment before trusting it. */
export async function verifyRazorpay(db: Db, userId: number, i: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, f: typeof fetch = fetch, now = Date.now()) {
  if (payMode() !== 'razorpay') throw new ApiError(400, 'Razorpay is not enabled.');
  const p = db.prepare("SELECT * FROM payments WHERE provider = 'razorpay' AND provider_order_id = ? AND user_id = ?").get(String(i.razorpay_order_id ?? ''), userId);
  if (!p) throw new ApiError(404, 'Payment not found.');
  if (p.status === 'paid') return { payment: p, result: apply(db, p, false) };
  const expected = hmac(process.env.RAZORPAY_KEY_SECRET!, `${p.provider_order_id}|${i.razorpay_payment_id}`);
  if (typeof i.razorpay_signature !== 'string' || !safeEqual(expected, i.razorpay_signature)) { db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(p.id); throw new ApiError(400, 'Payment verification failed. You have not been charged for this booking/order unless your bank says otherwise; contact us with your payment ID.'); }
  await confirmWithProvider(p, String(i.razorpay_payment_id), f);
  return { payment: p, result: settle(db, p, String(i.razorpay_payment_id), now) };
}

async function confirmWithProvider(p: any, paymentId: string, f: typeof fetch) {
  const get = await f(`${RZP}/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: auth() } });
  if (!get.ok) throw new ApiError(502, 'Could not confirm the payment with the provider. Please contact us.');
  let pay: any = await get.json();
  if (pay.order_id !== p.provider_order_id || pay.amount !== p.amount_paise) throw new ApiError(400, 'Payment details do not match this order.');
  if (pay.status === 'authorized') {
    const cap = await f(`${RZP}/payments/${encodeURIComponent(paymentId)}/capture`, { method: 'POST', headers: { Authorization: auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: p.amount_paise, currency: 'INR' }) });
    if (!cap.ok) throw new ApiError(502, 'Payment was authorised but could not be captured. Please contact us.');
    pay = await cap.json();
  }
  if (pay.status !== 'captured') throw new ApiError(400, 'The payment has not been completed.');
}

function settle(db: Db, p: any, providerPaymentId: string, now: number) {
  db.prepare("UPDATE payments SET status = 'paid', provider_payment_id = ?, verified_at = ? WHERE id = ?").run(providerPaymentId, new Date(now).toISOString(), p.id);
  return apply(db, p, false);
}

/** Demo mode only. Marks the booking/order as DEMO-paid; no money is moved and receipts say so. */
export function demoConfirm(db: Db, userId: number, paymentId: number) {
  if (payMode() !== 'demo') throw new ApiError(400, 'Demo payments are disabled.');
  const p = db.prepare("SELECT * FROM payments WHERE id = ? AND user_id = ? AND provider = 'demo'").get(paymentId, userId);
  if (!p) throw new ApiError(404, 'Payment not found.');
  if (p.status !== 'demo') db.prepare("UPDATE payments SET status = 'demo', verified_at = ? WHERE id = ?").run(new Date().toISOString(), p.id);
  return { payment: p, result: apply(db, p, true) };
}

/** Razorpay webhook (server-to-server). Settles payments even if the customer closed the browser early. */
export function handleWebhook(db: Db, raw: string, signature: string | null, now = Date.now()) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new ApiError(503, 'Webhook secret not configured.');
  if (!signature || !safeEqual(hmac(secret, raw), signature)) throw new ApiError(400, 'Bad signature.');
  const ev = JSON.parse(raw);
  const ent = ev?.payload?.payment?.entity;
  if (!['payment.captured', 'order.paid'].includes(ev.event) || !ent?.order_id) return { ignored: true };
  const p = db.prepare("SELECT * FROM payments WHERE provider = 'razorpay' AND provider_order_id = ?").get(ent.order_id);
  if (!p || p.status === 'paid' || ent.amount !== p.amount_paise) return { ignored: true };
  settle(db, p, ent.id, now);
  return { ok: true };
}
