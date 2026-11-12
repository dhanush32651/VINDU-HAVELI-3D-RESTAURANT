'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Smartphone, Banknote, X } from 'lucide-react';
import { totals, useStore } from '@/store/cartStore';
import { api } from '@/lib/client';
import { getReservation } from './ReservationBanner';
import RestaurantLogo from './RestaurantLogo';

type Step = 'details' | 'payment' | 'receipt';
const METHODS = [['upi', 'UPI', Smartphone], ['card', 'Card', CreditCard], ['cod', 'Cash on Delivery', Banknote]] as const;
declare global { interface Window { Razorpay?: any } }
const loadRazorpay = () => new Promise<boolean>((res) => {
  if (window.Razorpay) return res(true);
  const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
});
interface Intent { paymentId: number; mode: 'razorpay' | 'demo'; amountPaise: number; razorpayOrderId?: string; keyId?: string }
interface Receipt { code: string; total: number; lines: string[]; method: string; status: string; dineIn: boolean }

export default function CheckoutModal() {
  const { items, coupon, checkoutOpen, setCheckout, clear } = useStore();
  const [step, setStep] = useState<Step>('details'); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', phone: '', address: '', instructions: '' }); const [method, setMethod] = useState('upi');
  const [receipt, setReceipt] = useState<null | Receipt>(null);
  const [user, setUser] = useState<{ name: string; phone: string; role: string } | null | undefined>(undefined);
  const [payMode, setPayMode] = useState('demo'); const [res, setRes] = useState<{ code: string; table: string } | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const t = totals(items, coupon);

  useEffect(() => {
    if (!checkoutOpen) return;
    setErr(''); setRes(getReservation());
    fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => { setUser(d.user); if (d.user) setF((p) => ({ ...p, name: p.name || d.user.name, phone: p.phone || d.user.phone })); }).catch(() => setUser(null));
    fetch('/api/public-settings').then((r) => r.json()).then((d) => d.payMode && setPayMode(d.payMode)).catch(() => {});
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;
  const dineIn = !!res; const delivery = dineIn ? 0 : t.delivery; const total = t.total - t.delivery + delivery;
  const valid = f.name.trim() && /^\d{10}$/.test(f.phone) && (dineIn || f.address.trim());
  const close = () => { setCheckout(false); if (step === 'receipt') { clear(); setStep('details'); setReceipt(null); setPendingCode(null); } };

  const finishReceipt = (o: any) => { setReceipt({ code: o.code, total: o.total, lines: o.items.map((i: any) => `${i.qty} × ${i.name}`), method: o.payment_method, status: o.payment_status, dineIn: o.order_type === 'dine_in' }); setStep('receipt'); };
  const confirmWith = async (intent: Intent, code: string) => {
    if (intent.mode === 'demo') { await api('/api/payments/demo-confirm', { body: { paymentId: intent.paymentId } }); }
    else {
      if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Check your internet connection.');
      await new Promise<void>((resolve, reject) => new window.Razorpay({
        key: intent.keyId, amount: intent.amountPaise, currency: 'INR', order_id: intent.razorpayOrderId, name: 'VINDU HAVELI', description: `Food order ${code}`, prefill: { name: f.name, contact: f.phone }, theme: { color: '#D6AD65' },
        handler: (r: any) => api('/api/payments/verify', { body: r }).then(() => resolve()).catch(reject),
        modal: { ondismiss: () => reject(new Error('Payment was not completed. Press Pay to try again.')) },
      }).open());
    }
    finishReceipt((await api<{ order: any }>(`/api/orders/${code}`)).order);
  };
  const pay = async () => {
    setErr(''); setBusy(true);
    try {
      if (pendingCode && method !== 'cod') { const r = await api<{ intent: Intent }>(`/api/orders/${pendingCode}/pay`, { body: {} }); await confirmWith(r.intent, pendingCode); }
      else {
        const r = await api<{ order: any; intent: Intent | null }>('/api/orders', { body: { items: items.map((i) => ({ id: i.dish.id, qty: i.qty })), coupon, method, name: f.name, phone: f.phone, address: f.address, instructions: f.instructions, reservationCode: res?.code } });
        if (!r.intent) finishReceipt(r.order); else { setPendingCode(r.order.code); await confirmWith(r.intent, r.order.code); }
      }
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  const statusText = (s: string) => (s === 'paid' ? 'Paid' : s === 'demo' ? 'DEMO – not charged' : s === 'cod' ? (receipt?.dineIn ? 'Pay at table' : 'Pay on delivery') : s);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel max-h-[92vh] w-full max-w-lg overflow-y-auto p-7">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-3xl gold-text">{step === 'receipt' ? 'Order Confirmed' : 'Checkout'}</h2><button aria-label="Close" onClick={close}><X /></button></div>
        {user === undefined && <p className="py-8 text-center text-taupe">Loading…</p>}
        {user === null && step !== 'receipt' && (
          <div className="space-y-4 py-4 text-center"><p className="text-taupe">Please log in or create a free account to place your order. Your cart will be waiting for you.</p>
            <div className="flex justify-center gap-3"><Link href="/login?next=/menu" onClick={() => setCheckout(false)} className="btn-gold">Log in</Link><Link href="/signup?next=/menu" onClick={() => setCheckout(false)} className="btn-ghost">Create account</Link></div></div>)}
        {user && user.role === 'owner' && step !== 'receipt' && <p className="py-6 text-center text-taupe">Owner accounts cannot place customer orders. Please use a customer account.</p>}
        {user && user.role === 'customer' && step === 'details' && (<div className="space-y-3">
          {dineIn && <p className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-champagne">🍽️ Dine-in order for <b>{res!.table}</b> (booking {res!.code}). No delivery address needed.</p>}
          <input className="input" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" placeholder="10-digit mobile number" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          {!dineIn && <textarea className="input" rows={3} placeholder="Delivery address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
          <textarea className="input" rows={2} maxLength={400} placeholder="Special instructions for the kitchen (optional) – less spicy, no onion…" value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
          <button disabled={!valid || items.length === 0} className="btn-gold w-full disabled:opacity-40" onClick={() => setStep('payment')}>Continue to Payment · ₹{total}</button></div>)}
        {user && user.role === 'customer' && step === 'payment' && (<div className="space-y-3">
          {METHODS.map(([k, l, I]) => (<button key={k} onClick={() => setMethod(k)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${method === k ? 'border-gold bg-gold/10' : 'border-gold/20'}`}><I size={18} className="text-gold" />{k === 'cod' && dineIn ? 'Pay at table' : l}</button>))}
          {payMode === 'demo' && method === 'upi' && <input className="input" placeholder="yourname@upi" />}
          {payMode === 'demo' && method === 'card' && <div className="grid grid-cols-2 gap-3"><input className="input col-span-2" placeholder="Card number" inputMode="numeric" /><input className="input" placeholder="MM/YY" /><input className="input" placeholder="CVV" /></div>}
          {method !== 'cod' && payMode === 'demo' && <p className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-2 text-xs text-amber-300">DEMO MODE — live payments are not set up yet. No real payment is processed; the order is recorded as a demo payment.</p>}
          {method !== 'cod' && payMode === 'razorpay' && <p className="text-xs text-taupe">You will pay securely in the Razorpay window.</p>}
          {method !== 'cod' && payMode === 'disabled' && <p className="text-xs text-red-400">Online payment is unavailable right now. Choose Cash on Delivery or call us.</p>}
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
          <button disabled={busy || (method !== 'cod' && payMode === 'disabled')} className="btn-gold w-full disabled:opacity-50" onClick={pay}>{busy ? 'Processing…' : method === 'cod' ? 'Place Order' : payMode === 'demo' ? `Pay ₹${total} (demo)` : `Pay ₹${total}`}</button>
          <button className="w-full text-sm text-taupe underline" onClick={() => setStep('details')}>Back</button></div>)}
        {step === 'receipt' && receipt && (<div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto text-gold" size={48} />
          <p className="text-taupe">Thank you, {f.name}. {receipt.dineIn ? 'Your food will be prepared for your table.' : 'Your feast is being prepared.'}</p>
          <div className="print-area rounded-xl border border-dashed border-gold/40 p-4 text-left text-sm">
            <div className="mb-3 flex justify-center"><RestaurantLogo variant="receipt" /></div>
            <p className="font-mono text-champagne">Order #{receipt.code}</p>
            <ul className="my-2 space-y-1 text-taupe">{receipt.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="text-taupe">Payment: {receipt.method.toUpperCase()} · {statusText(receipt.status)}</p><p className="mt-1 font-serif text-xl text-champagne">Total ₹{receipt.total}</p></div>
          <div className="flex flex-wrap justify-center gap-3"><button className="btn-ghost" onClick={() => window.print()}>Print Receipt</button><Link href={`/orders/${receipt.code}`} onClick={close} className="btn-ghost">Track order</Link><button className="btn-gold" onClick={close}>Done</button></div></div>)}
      </div>
    </div>
  );
}
