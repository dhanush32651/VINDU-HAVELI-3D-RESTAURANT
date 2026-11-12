'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import { NEXT, cancelOrder, setOrder, useNewOrderAlert } from './OrdersPanel';
import { usePoll } from './usePoll';

const COLORS: Record<string, string> = { new: 'border-amber-400 bg-amber-400/10', accepted: 'border-sky-400 bg-sky-400/10', preparing: 'border-orange-400 bg-orange-400/10' };

// Big-text ticket view for the kitchen: what to cook, how many, and any special instructions.
export default function KitchenView() {
  const [err, setErr] = useState(''); const [, tick] = useState(0);
  const { data, error, refresh } = usePoll(() => api<{ orders: any[] }>('/api/owner/orders?active=1'), 6000, []);
  useNewOrderAlert(data?.orders);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);
  const orders = useMemo(() => [...(data?.orders ?? [])].sort((a, b) => a.id - b.id), [data]);
  const prep = useMemo(() => { const m = new Map<string, number>(); for (const o of orders) if (o.status !== 'ready') for (const i of o.items) m.set(i.name, (m.get(i.name) ?? 0) + i.qty); return [...m].sort((a, b) => b[1] - a[1]); }, [orders]);
  const mins = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return (
    <div className="space-y-6">
      {(err || error) && <p role="alert" className="text-red-400">{err || error}</p>}
      <section className="panel p-4">
        <h3 className="mb-3 font-serif text-xl text-champagne">Total to prepare now</h3>
        {prep.length === 0 ? <p className="text-taupe">Nothing waiting. 🎉</p> : <ul className="flex flex-wrap gap-2">{prep.map(([n, q]) => <li key={n} className="rounded-full border border-gold/40 px-4 py-1.5 text-lg"><b className="text-gold">{q}×</b> {n}</li>)}</ul>}
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((o) => (
          <article key={o.id} className={`rounded-2xl border-2 p-4 ${COLORS[o.status]}`}>
            <div className="flex items-start justify-between"><div><p className="font-mono text-lg text-champagne">{o.code}</p><p className="text-sm text-taupe">{o.order_type === 'dine_in' ? `🍽️ DINE-IN · ${o.table_label}` : '🛵 DELIVERY'} · {mins(o.created_at)} min ago</p></div><span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold uppercase">{o.status}</span></div>
            <ul className="my-3 space-y-1.5">{o.items.map((i: any) => <li key={i.dish_id} className="flex items-baseline gap-3 text-xl"><b className="w-12 shrink-0 text-right text-3xl text-gold">{i.qty}×</b><span>{i.veg ? '🟢' : '🔴'} {i.name}</span></li>)}</ul>
            {o.instructions && <p className="mb-3 rounded-lg bg-amber-400/20 px-3 py-2 text-lg font-semibold text-amber-200">📝 {o.instructions}</p>}
            <div className="flex gap-2">
              {NEXT[o.status] && <button className="btn-gold flex-1 !py-3 !text-base" onClick={() => setOrder(o.id, { status: NEXT[o.status][0] }).then(refresh).catch((e) => setErr(e.message))}>{NEXT[o.status][1]}</button>}
              <button className="rounded-full border border-red-400/50 px-4 text-sm text-red-400" onClick={() => cancelOrder(o, refresh, setErr)}>Cancel</button>
            </div>
          </article>))}
      </div>
    </div>
  );
}
