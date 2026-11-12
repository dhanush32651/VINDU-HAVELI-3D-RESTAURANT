'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import { METHOD, ORDER_COLOR, ORDER_PAY, ORDER_STATUS } from '@/lib/labels';
import { beep, usePoll } from './usePoll';

export const NEXT: Record<string, [string, string]> = { new: ['accepted', 'Accept'], accepted: ['preparing', 'Start preparing'], preparing: ['ready', 'Mark ready'], ready: ['completed', 'Complete'] };
export async function setOrder(id: number, body: object) { return api(`/api/owner/orders/${id}`, { method: 'PATCH', body }); }
export function cancelOrder(o: any, done: () => void, fail: (m: string) => void) {
  const reason = prompt(`Reason for cancelling ${o.code}? (shown to the customer)`); if (!reason?.trim()) return;
  setOrder(o.id, { status: 'cancelled', reason }).then(done).catch((e) => fail(e.message));
}

// Watches for new orders and beeps once per new order.
export function useNewOrderAlert(orders: any[] | undefined) {
  const seen = useRef<number | null>(null);
  useEffect(() => { if (!orders) return; const max = Math.max(0, ...orders.map((o) => o.id)); if (seen.current !== null && max > seen.current) beep(); seen.current = Math.max(seen.current ?? 0, max); }, [orders]);
}

const FILTERS = ['all', 'new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
export default function OrdersPanel() {
  const [status, setStatus] = useState('all'); const [err, setErr] = useState('');
  const { data, error, refresh } = usePoll(() => api<{ orders: any[] }>(`/api/owner/orders?status=${status}`), 8000, [status]);
  useNewOrderAlert(status === 'all' ? data?.orders : undefined);
  const list = data?.orders ?? [];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">{FILTERS.map((f) => <button key={f} onClick={() => setStatus(f)} className={`chip capitalize ${status === f ? 'chip-on' : ''}`}>{f}</button>)}</div>
      {(err || error) && <p role="alert" className="text-sm text-red-400">{err || error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((o) => (
          <article key={o.id} className="panel space-y-3 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-base text-champagne">{o.code}</p><span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${ORDER_COLOR[o.status]}`}>{ORDER_STATUS[o.status]}</span></div>
            <div><p className="font-semibold">{o.customer_name} · <a href={`tel:+91${o.customer_phone}`} className="text-gold">{o.customer_phone}</a></p>
              <p className="text-xs text-taupe">{o.order_type === 'dine_in' ? `Dine-in · ${o.table_label} (booking ${o.reservation_code})` : `Delivery · ${o.address}`}</p></div>
            <ul className="divide-y divide-gold/10 rounded-lg border border-gold/15">{o.items.map((i: any) => <li key={i.dish_id} className="flex justify-between px-3 py-1.5"><span>{i.veg ? '🟢' : '🔴'} {i.name}</span><b>× {i.qty}</b></li>)}</ul>
            {o.instructions && <p className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-amber-300">📝 {o.instructions}</p>}
            <div className="flex flex-wrap justify-between gap-2 text-xs text-taupe"><span>{METHOD[o.payment_method]} · <b className={o.payment_status === 'refund_pending' ? 'text-red-400' : ''}>{ORDER_PAY[o.payment_status]}</b></span><span>{new Date(o.created_at).toLocaleString('en-IN')}</span></div>
            <div className="flex items-center justify-between"><span className="font-serif text-xl text-champagne">₹{o.total}</span>
              <div className="flex flex-wrap gap-2">
                {NEXT[o.status] && <button className="btn-gold !px-3 !py-1.5 !text-xs" onClick={() => setOrder(o.id, { status: NEXT[o.status][0] }).then(refresh).catch((e) => setErr(e.message))}>{NEXT[o.status][1]}</button>}
                {NEXT[o.status] && <button className="rounded-full border border-red-400/50 px-3 py-1 text-xs text-red-400" onClick={() => cancelOrder(o, refresh, setErr)}>Cancel</button>}
                {o.payment_status === 'refund_pending' && <button className="btn-ghost !px-3 !py-1 !text-xs" onClick={() => setOrder(o.id, { action: 'refunded' }).then(refresh).catch((e) => setErr(e.message))}>Mark refund done</button>}
              </div></div>
            {o.status === 'cancelled' && <p className="text-xs text-red-400">Cancelled: {o.cancel_reason}</p>}
          </article>))}
      </div>
      {data && list.length === 0 && <p className="panel p-8 text-center text-taupe">No orders here yet.</p>}
    </div>
  );
}
