import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { freshDb, addUser, NOW } from './helpers';
import { createBooking } from '@/lib/services/bookings';
import { createIntent, demoConfirm, verifyRazorpay, handleWebhook, payMode } from '@/lib/services/payments';
import { createOrder, ownerListOrders, ownerSetOrderStatus, getOrderByCode, ownerOrderRefunded } from '@/lib/services/orders';
import { ALL_DISHES } from '@/data/dishes';

const book = { date: '2026-11-13', start: 19 * 60, guests: 2, tableId: 1, name: 'Asha Rao', phone: '9876543210' };
const KEY = 'rzp_test_key', SECRET = 'topsecret';
const sign = (o: string, p: string) => crypto.createHmac('sha256', SECRET).update(`${o}|${p}`).digest('hex');
const env = (rz: boolean) => { delete process.env.ALLOW_DEMO_PAYMENTS; if (rz) { process.env.RAZORPAY_KEY_ID = KEY; process.env.RAZORPAY_KEY_SECRET = SECRET; } else { delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET; } };
const mockFetch = (payment: any = {}) => (async (url: string, init?: any) => {
  if (url.endsWith('/orders')) return { ok: true, status: 200, json: async () => ({ id: 'order_ABC' }) };
  if (url.includes('/capture')) return { ok: true, status: 200, json: async () => ({ ...payment, status: 'captured' }) };
  return { ok: true, status: 200, json: async () => payment };
}) as any;

test('no keys + demo allowed => demo mode; ALLOW_DEMO_PAYMENTS=false => disabled; keys => razorpay', async () => {
  env(false); assert.equal(payMode(), 'demo'); process.env.ALLOW_DEMO_PAYMENTS = 'false'; assert.equal(payMode(), 'disabled');
  const db = freshDb(); const u = addUser(db); const b = createBooking(db, u, book, NOW);
  await assert.rejects(() => createIntent(db, { purpose: 'booking', refId: b.id, userId: u.id, amountPaise: 20000, receipt: b.code }), /not configured/);
  env(true); assert.equal(payMode(), 'razorpay'); env(false);
});

test('demo payment is recorded as DEMO, never as paid', async () => {
  env(false); const db = freshDb(); const u = addUser(db); const b = createBooking(db, u, book, NOW);
  const i = await createIntent(db, { purpose: 'booking', refId: b.id, userId: u.id, amountPaise: b.advance_paise, receipt: b.code });
  assert.equal(i.mode, 'demo');
  assert.equal(db.prepare('SELECT status FROM reservations WHERE id = ?').get(b.id).status, 'held');      // nothing changes until confirmed
  const other = addUser(db, 'customer', 2); assert.throws(() => demoConfirm(db, other.id, i.paymentId), /not found/);
  demoConfirm(db, u.id, i.paymentId);
  const r = db.prepare('SELECT status, payment_status FROM reservations WHERE id = ?').get(b.id);
  assert.equal(r.payment_status, 'demo'); assert.notEqual(r.payment_status, 'paid'); assert.equal(r.status, 'pending');
  assert.equal(db.prepare('SELECT status FROM payments WHERE id = ?').get(i.paymentId).status, 'demo');
});

test('razorpay: valid signature + provider confirmation => paid; forged signature => rejected', async () => {
  env(true); const db = freshDb(); const u = addUser(db); const b = createBooking(db, u, book, NOW);
  const f = mockFetch({ id: 'pay_1', order_id: 'order_ABC', amount: 20000, status: 'captured' });
  const i = await createIntent(db, { purpose: 'booking', refId: b.id, userId: u.id, amountPaise: 20000, receipt: b.code }, f);
  assert.equal(i.razorpayOrderId, 'order_ABC'); assert.equal(i.keyId, KEY); assert.ok(!JSON.stringify(i).includes(SECRET));
  await assert.rejects(() => verifyRazorpay(db, u.id, { razorpay_order_id: 'order_ABC', razorpay_payment_id: 'pay_1', razorpay_signature: 'forged' }, f), /verification failed/);
  assert.equal(db.prepare('SELECT payment_status FROM reservations WHERE id = ?').get(b.id).payment_status, 'unpaid');
  const other = addUser(db, 'customer', 2);
  await assert.rejects(() => verifyRazorpay(db, other.id, { razorpay_order_id: 'order_ABC', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_ABC', 'pay_1') }, f), /not found/);
  await verifyRazorpay(db, u.id, { razorpay_order_id: 'order_ABC', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_ABC', 'pay_1') }, f);
  const r = db.prepare('SELECT status, payment_status FROM reservations WHERE id = ?').get(b.id); assert.equal(r.payment_status, 'paid'); assert.equal(r.status, 'pending');
  assert.throws(() => demoConfirm(db, u.id, i.paymentId), /disabled|not found/);
  env(false);
});

test('razorpay: provider says not captured / wrong amount => not paid', async () => {
  env(true); const db = freshDb(); const u = addUser(db); const b = createBooking(db, u, book, NOW);
  const mk = (p: any) => mockFetch(p);
  await createIntent(db, { purpose: 'booking', refId: b.id, userId: u.id, amountPaise: 20000, receipt: b.code }, mk({}));
  const proof = { razorpay_order_id: 'order_ABC', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_ABC', 'pay_1') };
  await assert.rejects(() => verifyRazorpay(db, u.id, proof, mk({ id: 'pay_1', order_id: 'order_ABC', amount: 20000, status: 'failed' })), /not been completed/);
  await assert.rejects(() => verifyRazorpay(db, u.id, proof, mk({ id: 'pay_1', order_id: 'order_ABC', amount: 100, status: 'captured' })), /do not match/);
  assert.equal(db.prepare('SELECT payment_status FROM reservations WHERE id = ?').get(b.id).payment_status, 'unpaid');
  env(false);
});

test('webhook: bad signature rejected, good captured event settles the booking once', async () => {
  env(true); process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec'; const db = freshDb(); const u = addUser(db); const b = createBooking(db, u, book, NOW);
  await createIntent(db, { purpose: 'booking', refId: b.id, userId: u.id, amountPaise: 20000, receipt: b.code }, mockFetch());
  const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_9', order_id: 'order_ABC', amount: 20000 } } } });
  assert.throws(() => handleWebhook(db, raw, 'nope'), /Bad signature/);
  const sig = crypto.createHmac('sha256', 'whsec').update(raw).digest('hex');
  assert.deepEqual(handleWebhook(db, raw, sig), { ok: true }); assert.deepEqual(handleWebhook(db, raw, sig), { ignored: true });
  assert.equal(db.prepare('SELECT payment_status FROM reservations WHERE id = ?').get(b.id).payment_status, 'paid');
  const wrongAmt = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'x', order_id: 'order_ABC', amount: 1 } } } });
  assert.deepEqual(handleWebhook(db, wrongAmt, crypto.createHmac('sha256', 'whsec').update(wrongAmt).digest('hex')), { ignored: true });
  env(false); delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

const cart = (...pairs: [string, number][]) => pairs.map(([id, qty]) => ({ id, qty }));
const o1 = { name: 'Asha Rao', phone: '9876543210', address: '12 MG Road, Markapur', method: 'cod', instructions: 'Less spicy please' };

test('order: server recomputes prices from the real menu (client prices ignored) and stores line items', () => {
  const db = freshDb(); const u = addUser(db);
  const d1 = ALL_DISHES[0], d2 = ALL_DISHES[1];
  const o = createOrder(db, u, { ...o1, items: [{ id: d1.id, qty: 2, price: 1 }, { id: d2.id, qty: 1 }], coupon: 'WELCOME10' }, NOW);
  const sub = d1.price * 2 + d2.price; assert.equal(o.subtotal, sub); assert.equal(o.discount, Math.round(sub * 0.1)); assert.equal(o.items.length, 2); assert.equal(o.items[0].qty, 2);
  assert.equal(o.total, o.subtotal - o.discount + o.tax + o.delivery_fee); assert.equal(o.instructions, 'Less spicy please'); assert.equal(o.payment_status, 'cod'); assert.equal(o.status, 'new');
  assert.throws(() => createOrder(db, u, { ...o1, items: cart(['nope', 1]) }, NOW), /no longer/);
  assert.throws(() => createOrder(db, u, { ...o1, items: [] }, NOW), /empty/);
  assert.throws(() => createOrder(db, u, { ...o1, items: cart([d1.id, 0]) }, NOW), /Quantity/);
  assert.throws(() => createOrder(db, u, { ...o1, address: '', items: cart([d1.id, 1]) }, NOW), /address/);
  const bad = createOrder(db, u, { ...o1, items: cart([d2.id, 1]), coupon: 'FEAST200' }, NOW); assert.equal(bad.discount, 0);   // min subtotal not met
});

test('order visible to owner only once payment is verified (or COD); online orders stay hidden until paid', async () => {
  env(false); const db = freshDb(); const u = addUser(db); const d = ALL_DISHES[0];
  const cod = createOrder(db, u, { ...o1, items: cart([d.id, 1]) }, NOW);
  const upi = createOrder(db, u, { ...o1, method: 'upi', items: cart([d.id, 1]) }, NOW); assert.equal(upi.payment_status, 'pending');
  assert.deepEqual(ownerListOrders(db, {}).map((o: any) => o.code), [cod.code]);
  const i = await createIntent(db, { purpose: 'order', refId: upi.id, userId: u.id, amountPaise: upi.total * 100, receipt: upi.code }); demoConfirm(db, u.id, i.paymentId);
  const list = ownerListOrders(db, {}); assert.equal(list.length, 2); assert.equal(getOrderByCode(db, upi.code).payment_status, 'demo');
});

test('order status flow New > Accepted > Preparing > Ready > Completed; cancel needs a reason; no skipping', () => {
  const db = freshDb(); const u = addUser(db); const o = createOrder(db, u, { ...o1, items: cart([ALL_DISHES[0].id, 1]) }, NOW);
  assert.throws(() => ownerSetOrderStatus(db, o.id, 'ready'), /Next step/);
  for (const s of ['accepted', 'preparing', 'ready', 'completed']) assert.equal(ownerSetOrderStatus(db, o.id, s).status, s);
  assert.throws(() => ownerSetOrderStatus(db, o.id, 'cancelled', 'x'), /already completed/);
  const o2 = createOrder(db, u, { ...o1, items: cart([ALL_DISHES[0].id, 1]) }, NOW);
  assert.throws(() => ownerSetOrderStatus(db, o2.id, 'cancelled', ''), /reason/);
  const c = ownerSetOrderStatus(db, o2.id, 'cancelled', 'Out of stock'); assert.equal(c.status, 'cancelled'); assert.equal(c.cancel_reason, 'Out of stock');
  assert.equal(ownerListOrders(db, { active: true }).length, 0); assert.equal(ownerListOrders(db, { status: 'cancelled' }).length, 1);
});

test('cancelling a really-paid order flags a refund; owner can mark it refunded', async () => {
  env(true); const db = freshDb(); const u = addUser(db); const o = createOrder(db, u, { ...o1, method: 'card', items: cart([ALL_DISHES[0].id, 1]) }, NOW);
  const f = mockFetch({ id: 'pay_2', order_id: 'order_ABC', amount: o.total * 100, status: 'captured' });
  await createIntent(db, { purpose: 'order', refId: o.id, userId: u.id, amountPaise: o.total * 100, receipt: o.code }, f);
  await verifyRazorpay(db, u.id, { razorpay_order_id: 'order_ABC', razorpay_payment_id: 'pay_2', razorpay_signature: sign('order_ABC', 'pay_2') }, f);
  assert.equal(ownerSetOrderStatus(db, o.id, 'cancelled', 'Kitchen closed').payment_status, 'refund_pending');
  assert.equal(ownerOrderRefunded(db, o.id).payment_status, 'refunded'); assert.throws(() => ownerOrderRefunded(db, o.id), /No refund/);
  env(false);
});

test('order linked to an active reservation becomes dine-in on that table (no address, no delivery fee); foreign/inactive reservations refused', () => {
  const db = freshDb(); const u = addUser(db, 'customer', 1), v = addUser(db, 'customer', 2);
  const b = createBooking(db, u, book, NOW);
  assert.throws(() => createOrder(db, u, { ...o1, reservationCode: b.code, items: cart([ALL_DISHES[0].id, 1]) }, NOW), /not active/);   // still unpaid hold
  db.prepare("UPDATE reservations SET status = 'confirmed', payment_status = 'demo' WHERE id = ?").run(b.id);
  const o = createOrder(db, u, { ...o1, address: '', reservationCode: b.code, items: cart([ALL_DISHES[0].id, 1]) }, NOW);
  assert.equal(o.order_type, 'dine_in'); assert.equal(o.table_label, 'TABLE 01'); assert.equal(o.reservation_code, b.code); assert.equal(o.delivery_fee, 0);
  assert.throws(() => createOrder(db, v, { ...o1, reservationCode: b.code, items: cart([ALL_DISHES[0].id, 1]) }, NOW), /not active/);
});
