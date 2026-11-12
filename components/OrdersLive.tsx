'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { api, rupees } from '@/lib/client';
import { ORDER_COLOR, ORDER_PAY, ORDER_STATUS } from '@/lib/labels';

const STEPS = ['new', 'accepted', 'preparing', 'ready', 'completed'];
export function StatusSteps({ status }: { status: string }) {
  if (status === 'cancelled') return null;
  const at = STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1 text-[11px] sm:text-xs" aria-label="Order progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center gap-1">
          <span className={`grid h-6 w-6 place-items-center rounded-full border ${i <= at ? 'border-gold bg-gold text-royal' : 'border-gold/30 text-taupe'}`}>{i < at ? <Check size={13} /> : i + 1}</span>
          <span className={i <= at ? 'text-champagne' : 'text-taupe'}>{ORDER_STATUS[s]}</span>
        </li>))}
    </ol>
  );
}

// Customer's orders, refreshed every 8 seconds so owner/kitchen status changes appear on their own.
export default function OrdersLive({ initial, limit }: { initial: any[]; limit?: number }) {
  const [orders, setOrders] = useState(initial);
  useEffect(() => { const t = setInterval(() => api<{ orders: any[] }>('/api/orders').then((r) => setOrders(r.orders)).catch(() => {}), 8000); return () => clearInterval(t); }, []);
  const list = limit ? orders.slice(0, limit) : orders;
  if (!list.length) return <p className="panel p-8 text-center text-taupe">No orders yet. <Link href="/menu" className="text-gold underline">Browse the menu</Link></p>;
  return (
    <div className="space-y-4">
      {list.map((o) => (
        <Link key={o.code} href={`/orders/${o.code}`} className="panel block space-y-3 p-5 transition hover:border-gold/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-champagne">{o.code}</p>
            <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${ORDER_COLOR[o.status]}`}>{ORDER_STATUS[o.status]}</span>
          </div>
          <p className="text-sm text-taupe">{o.items.map((i: any) => `${i.qty} × ${i.name}`).join(', ')}</p>
          <StatusSteps status={o.status} />
          {o.status === 'cancelled' && <p className="text-sm text-red-400">Cancelled: {o.cancel_reason}</p>}
          <div className="flex justify-between text-sm"><span className="text-taupe">{new Date(o.created_at).toLocaleString('en-IN')} · {ORDER_PAY[o.payment_status]}</span><span className="font-serif text-lg text-champagne">{rupees(o.total)}</span></div>
        </Link>))}
    </div>
  );
}
