'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { BOOKING_PAY, BOOKING_STATUS } from '@/lib/labels';
import { dateLabel, minutesLabel } from '@/lib/time';
import { usePoll } from './usePoll';

const ACTIONS: Record<string, [string, string, boolean][]> = {
  pending: [['confirmed', 'Accept', false], ['rejected', 'Reject', true]],
  confirmed: [['seated', 'Seat (occupied)', false], ['completed', 'Complete', false], ['no_show', 'No-show', false], ['cancelled', 'Cancel', true]],
  seated: [['completed', 'Complete', false]],
};

export default function ReservationsPanel() {
  const [date, setDate] = useState(''); const [q, setQ] = useState(''); const [open, setOpen] = useState<string | null>(null); const [err, setErr] = useState('');
  const { data, error, refresh } = usePoll(() => api<{ bookings: any[] }>(`/api/owner/bookings?date=${date}&q=${encodeURIComponent(q)}`), 15000, [date, q]);
  const act = async (id: number, body: object) => { setErr(''); try { await api(`/api/owner/bookings/${id}`, { method: 'PATCH', body }); refresh(); } catch (e: any) { setErr(e.message); } };
  const change = (b: any, status: string, needsReason: boolean) => {
    let reason = ''; if (needsReason) { const r = prompt(`Reason for ${status === 'rejected' ? 'rejecting' : 'cancelling'} ${b.code}? (shown to the customer)`); if (!r?.trim()) return; reason = r; }
    act(b.id, { status, reason });
  };
  const list = data?.bookings ?? [];
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs text-taupe">Filter by date<input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        {date && <button className="btn-ghost !py-2" onClick={() => setDate('')}>All dates</button>}
        <label className="min-w-[200px] flex-1 text-xs text-taupe">Search by booking ID, name or phone<input className="input mt-1" placeholder="VH-BK-…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      {(err || error) && <p role="alert" className="text-sm text-red-400">{err || error}</p>}
      <p className="text-sm text-taupe">{list.length} booking{list.length === 1 ? '' : 's'}</p>
      <div className="space-y-3">
        {list.map((b) => (
          <div key={b.id} className="panel p-4">
            <div className="grid gap-3 text-sm md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] md:items-center">
              <div><p className="font-mono text-champagne">{b.code}</p><p className="text-xs text-taupe">{b.table_label}</p></div>
              <div><p className="font-semibold">{b.customer_name}</p><a href={`tel:+91${b.customer_phone}`} className="text-xs text-gold">{b.customer_phone}</a></div>
              <div><p>{dateLabel(b.booking_date)}</p><p className="text-xs text-taupe">{minutesLabel(b.start_min)} – {minutesLabel(b.end_min)} · {b.guests} guests</p></div>
              <div><p>₹{b.advance_paise / 100}</p><p className={`text-xs ${b.payment_status === 'refund_pending' ? 'text-red-400' : 'text-taupe'}`}>{BOOKING_PAY[b.payment_status]}</p></div>
              <span className={`w-fit rounded-full border px-3 py-0.5 text-xs font-semibold ${BOOKING_STATUS[b.status][1]}`}>{BOOKING_STATUS[b.status][0]}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(ACTIONS[b.status] ?? []).map(([s, l, r]) => <button key={s} onClick={() => change(b, s, r)} className={r ? 'rounded-full border border-red-400/50 px-3 py-1 text-xs text-red-400 hover:bg-red-400/10' : 'btn-gold !px-3 !py-1 !text-xs'}>{l}</button>)}
              {b.payment_status === 'refund_pending' && <button onClick={() => act(b.id, { action: 'refunded' })} className="btn-ghost !px-3 !py-1 !text-xs">Mark refund done</button>}
              <button onClick={() => setOpen(open === b.code ? null : b.code)} className="ml-auto text-xs text-gold underline">{open === b.code ? 'Hide' : 'Customer details'}</button>
            </div>
            {open === b.code && <dl className="mt-3 grid gap-1 rounded-lg border border-gold/15 p-3 text-xs text-taupe sm:grid-cols-2"><div>Name: <b className="text-ivory">{b.customer_name}</b></div><div>Phone: <b className="text-ivory">{b.customer_phone}</b></div><div>Account email: <b className="text-ivory">{b.customer_email}</b></div><div>Booked on: <b className="text-ivory">{new Date(b.created_at).toLocaleString('en-IN')}</b></div><div className="sm:col-span-2">Notes: <b className="text-ivory">{b.notes || '—'}</b></div>{b.status_reason && <div className="sm:col-span-2">Reason: <b className="text-ivory">{b.status_reason}</b></div>}</dl>}
          </div>))}
        {data && list.length === 0 && <p className="panel p-8 text-center text-taupe">No bookings found.</p>}
      </div>
    </div>
  );
}
