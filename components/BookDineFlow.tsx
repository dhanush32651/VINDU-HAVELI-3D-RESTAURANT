'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarDays, Clock, Loader2, ShieldCheck, Users } from 'lucide-react';
import FloorPlan, { TableView } from './FloorPlan';
import { api } from '@/lib/client';
import { addDays, dateLabel, minutesLabel } from '@/lib/time';

interface Slot { start: number; free: number; past: boolean }
interface Intent { paymentId: number; mode: 'razorpay' | 'demo'; amountPaise: number; razorpayOrderId?: string; keyId?: string }
interface Pub { advance: number; duration: number; maxDays: number; today: string; payMode: string; hours: string }

declare global { interface Window { Razorpay?: any } }
const loadRazorpay = () => new Promise<boolean>((res) => {
  if (window.Razorpay) return res(true);
  const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
});

export default function BookDineFlow({ user }: { user: { name: string; phone: string; email: string } }) {
  const router = useRouter();
  const [pub, setPub] = useState<Pub | null>(null);
  const [date, setDate] = useState(''); const [guests, setGuests] = useState(2); const [slots, setSlots] = useState<Slot[] | null>(null); const [start, setStart] = useState<number | null>(null);
  const [tables, setTables] = useState<TableView[] | null>(null); const [tableId, setTableId] = useState<number | null>(null);
  const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone); const [notes, setNotes] = useState('');
  const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [pending, setPending] = useState<{ code: string; intent: Intent } | null>(null);

  useEffect(() => { api<Pub>('/api/public-settings').then((p) => { setPub(p); setDate(p.today); }).catch((e) => setErr(e.message)); }, []);
  const loadSlots = useCallback(async () => {
    if (!date) return; setSlots(null);
    try { const r = await api<{ slots: Slot[] }>(`/api/tables?date=${date}&guests=${guests}`); setSlots(r.slots); } catch (e: any) { setErr(e.message); setSlots([]); }
  }, [date, guests]);
  useEffect(() => { setStart(null); setTables(null); setTableId(null); setReview(false); setErr(''); loadSlots(); }, [loadSlots]);

  const loadTables = useCallback(async (s: number) => {
    try { const r = await api<{ tables: TableView[] }>(`/api/tables?date=${date}&start=${s}&guests=${guests}`); setTables(r.tables); setTableId((t) => (r.tables.find((x) => x.id === t && x.state === 'available' && x.fits) ? t : null)); } catch (e: any) { setErr(e.message); }
  }, [date, guests]);
  useEffect(() => { if (start != null) { setReview(false); loadTables(start); const t = setInterval(() => loadTables(start), 15000); return () => clearInterval(t); } }, [start, loadTables]);

  const table = tables?.find((t) => t.id === tableId);
  const detailsOk = name.trim().length >= 2 && /^\d{10}$/.test(phone);
  const maxDate = useMemo(() => (pub ? addDays(pub.today, pub.maxDays) : ''), [pub]);

  const finish = async (proof?: any) => {
    const r = await api<{ purpose: string; code: string }>(proof ? '/api/payments/verify' : '/api/payments/demo-confirm', { body: proof ?? { paymentId: pending!.intent.paymentId } });
    router.push(`/book-dine/confirmed/${r.code}`);
  };
  const openPayment = async (code: string, intent: Intent) => {
    setPending({ code, intent });
    if (intent.mode !== 'razorpay') return; // demo: user confirms in the labelled demo box below
    if (!(await loadRazorpay())) { setErr('Could not load the payment window. Check your internet and press "Try payment again".'); return; }
    new window.Razorpay({
      key: intent.keyId, amount: intent.amountPaise, currency: 'INR', order_id: intent.razorpayOrderId, name: 'VINDU HAVELI', description: `Table advance · ${code}`,
      prefill: { name, contact: phone, email: user.email }, theme: { color: '#D6AD65' },
      handler: (resp: any) => { setBusy(true); finish(resp).catch((e) => { setErr(e.message); setBusy(false); }); },
      modal: { ondismiss: () => setErr('Payment was not completed. Your table is held for a few minutes; press "Try payment again" to finish.') },
    }).open();
  };
  const pay = async () => {
    setErr(''); setBusy(true);
    try { const r = await api<{ booking: { code: string }; intent: Intent }>('/api/bookings', { body: { date, start, guests, tableId, name, phone, notes } }); await openPayment(r.booking.code, r.intent); }
    catch (e: any) { setErr(e.message); if (e.status === 409 && start != null) { setReview(false); setTableId(null); loadTables(start); } }
    setBusy(false);
  };
  const retry = async () => {
    if (!pending) return; setErr(''); setBusy(true);
    try { const r = await api<{ intent: Intent }>(`/api/bookings/${pending.code}/pay`, { body: {} }); await openPayment(pending.code, r.intent); } catch (e: any) { setErr(e.message); setPending(null); }
    setBusy(false);
  };
  const demoPay = async () => { setBusy(true); setErr(''); try { await finish(); } catch (e: any) { setErr(e.message); setBusy(false); } };

  if (!pub) return <p className="py-20 text-center text-taupe">{err || 'Loading…'}</p>;
  const step = (n: number, t: string) => <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl"><span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-sm font-bold text-royal">{n}</span>{t}</h2>;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section className="panel p-6">
        {step(1, 'Choose date, guests and time')}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-taupe"><span className="mb-1 flex items-center gap-2"><CalendarDays size={14} />Booking date</span>
            <input type="date" className="input" value={date} min={pub.today} max={maxDate} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
          <label className="block text-sm text-taupe"><span className="mb-1 flex items-center gap-2"><Users size={14} />Number of guests</span>
            <select className="input" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>{Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}</select></label>
        </div>
        <p className="mb-2 mt-5 flex items-center gap-2 text-sm text-taupe"><Clock size={14} />Booking time · each booking holds a table for {pub.duration} minutes · open {pub.hours}</p>
        {!slots ? <p className="text-taupe">Loading times…</p> : slots.length === 0 ? <p className="text-red-400">No times available for this date.</p> : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((s) => { const off = s.past || s.free === 0; return (
              <button key={s.start} disabled={off} onClick={() => setStart(s.start)} className={`rounded-lg border px-2 py-2 text-sm transition ${start === s.start ? 'border-gold bg-gold text-royal' : off ? 'cursor-not-allowed border-gold/10 text-taupe/40 line-through' : 'border-gold/30 hover:border-gold'}`}>
                {minutesLabel(s.start)}<span className="block text-[10px] opacity-70">{s.past ? 'passed' : s.free === 0 ? 'full' : `${s.free} free`}</span></button>); })}
          </div>)}
      </section>

      {start != null && (
        <section className="panel p-6">
          {step(2, 'Pick your table')}
          <p className="mb-4 text-sm text-taupe">{dateLabel(date)} · {minutesLabel(start)} – {minutesLabel(start + pub.duration)} · {guests} {guests === 1 ? 'guest' : 'guests'}</p>
          {!tables ? <p className="text-taupe">Loading tables…</p> : <FloorPlan tables={tables} selected={tableId} onSelect={(id) => { setTableId(id); setReview(false); }} />}
        </section>)}

      {table && (
        <section className="panel p-6">
          {step(3, 'Your details')}
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="10-digit mobile number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <textarea className="input sm:col-span-2" rows={2} maxLength={300} placeholder="Special requests (optional) – birthday, high chair, window side…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button disabled={!detailsOk} className="btn-gold mt-4 disabled:opacity-40" onClick={() => setReview(true)}>Review booking</button>
        </section>)}

      {table && review && start != null && (
        <section className="panel p-6">
          {step(4, 'Review & pay advance')}
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[['Table', table.label], ['Date', dateLabel(date)], ['Time', `${minutesLabel(start)} – ${minutesLabel(start + pub.duration)}`], ['Guests', String(guests)], ['Name', name], ['Phone', phone]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-gold/15 py-1.5"><dt className="text-taupe">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
          <p className="mt-4 flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 font-serif text-xl text-champagne"><span>Advance to pay now</span><span>₹{pub.advance}</span></p>
          {pub.payMode === 'demo' && <p className="mt-3 flex gap-2 rounded-lg border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-300"><AlertTriangle size={16} className="mt-0.5 shrink-0" />DEMO MODE: live payments are not set up on this website yet. No money will be charged and the booking will be marked as a demo payment.</p>}
          {pub.payMode === 'disabled' && <p className="mt-3 text-sm text-red-400">Online payments are not available right now. Please call the restaurant to book.</p>}
          {!pending && <button disabled={busy || pub.payMode === 'disabled'} onClick={pay} className="btn-gold mt-4 w-full disabled:opacity-50 sm:w-auto">{busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}{pub.payMode === 'demo' ? `Continue to demo payment · ₹${pub.advance}` : `Pay ₹${pub.advance} securely`}</button>}
          {pending && pending.intent.mode === 'demo' && (
            <div className="mt-4 space-y-3 rounded-xl border-2 border-dashed border-amber-400/60 p-4">
              <p className="font-semibold text-amber-300">DEMO PAYMENT — no real money is taken</p>
              <p className="text-sm text-taupe">Booking {pending.code} is holding {table.label}. Confirm to mark it as a demo payment.</p>
              <button disabled={busy} onClick={demoPay} className="btn-gold disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}Confirm demo payment of ₹{pub.advance}</button>
            </div>)}
          {pending && pending.intent.mode === 'razorpay' && <button disabled={busy} onClick={retry} className="btn-ghost mt-4">Try payment again</button>}
        </section>)}

      {err && <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</p>}
    </div>
  );
}
