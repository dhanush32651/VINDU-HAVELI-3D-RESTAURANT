'use client';
import { useEffect, useState } from 'react';
import RestaurantLogo from './RestaurantLogo';
import ReceiptActions from './ReceiptActions';
import { StatusSteps } from './OrdersLive';
import { api } from '@/lib/client';
import { METHOD, ORDER_COLOR, ORDER_PAY, ORDER_STATUS } from '@/lib/labels';
import { RESTAURANT as R } from '@/data/restaurant';

export default function OrderReceipt({ initial }: { initial: any }) {
  const [o, setO] = useState(initial);
  useEffect(() => { const t = setInterval(() => api<{ order: any }>(`/api/orders/${initial.code}`).then((r) => setO(r.order)).catch(() => {}), 8000); return () => clearInterval(t); }, [initial.code]);
  return (
    <div className="space-y-6">
      <div className="panel mx-auto max-w-lg space-y-4 p-6 no-print">
        <div className="flex items-center justify-between"><h2 className="font-serif text-2xl gold-text">Order status</h2><span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${ORDER_COLOR[o.status]}`}>{ORDER_STATUS[o.status]}</span></div>
        <StatusSteps status={o.status} />
        {o.status === 'cancelled' && <p className="text-sm text-red-400">Cancelled: {o.cancel_reason}{o.payment_status === 'refund_pending' ? ' · Your refund is being processed by the restaurant.' : ''}</p>}
        <p className="text-xs text-taupe">This page refreshes by itself.</p>
      </div>
      <div className="print-area mx-auto w-full max-w-lg rounded-2xl border-2 border-[#b8893a] bg-[#fffdf7] p-6 text-[#2a2113] shadow-xl sm:p-8">
        <div className="border-b border-dashed border-[#b8893a] pb-4 text-center"><div className="flex justify-center"><RestaurantLogo variant="receipt" paper /></div><p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em]">Order Receipt</p></div>
        <dl className="mt-3 divide-y divide-[#eadfc4] text-sm">
          {([['Order ID', o.code], ['Customer', o.customer_name], ['Phone', o.customer_phone], ['Order type', o.order_type === 'dine_in' ? `Dine-in · ${o.table_label}` : 'Delivery'], ...(o.address ? [['Address', o.address]] : []), ...(o.instructions ? [['Instructions', o.instructions]] : []),
            ['Placed', new Date(o.created_at).toLocaleString('en-IN')], ['Payment', `${METHOD[o.payment_method]} · ${ORDER_PAY[o.payment_status]}`]] as string[][]).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[34%_1fr] gap-2 py-2"><dt className="text-[#6b5b3e]">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
        </dl>
        <ul className="my-3 space-y-1 border-y border-[#eadfc4] py-3 text-sm">{o.items.map((i: any) => <li key={i.dish_id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>₹{i.qty * i.unit_price}</span></li>)}</ul>
        <div className="space-y-1 text-sm text-[#6b5b3e]">
          <p className="flex justify-between"><span>Subtotal</span><span>₹{o.subtotal}</span></p>{o.discount > 0 && <p className="flex justify-between"><span>Discount {o.coupon && `(${o.coupon})`}</span><span>-₹{o.discount}</span></p>}
          <p className="flex justify-between"><span>GST</span><span>₹{o.tax}</span></p><p className="flex justify-between"><span>Delivery</span><span>{o.delivery_fee ? `₹${o.delivery_fee}` : 'Free'}</span></p>
          <p className="flex justify-between border-t border-[#eadfc4] pt-2 font-serif text-xl font-bold text-[#8a6416]"><span>Total</span><span>₹{o.total}</span></p>
        </div>
        {o.payment_status === 'demo' && <p className="mt-3 rounded-lg border border-amber-600/40 bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-900">DEMO MODE – no money was charged.</p>}
        <p className="mt-4 text-center text-xs leading-relaxed text-[#6b5b3e]">{R.address}<br />{R.phone}</p>
      </div>
      <ReceiptActions kind="order" data={o} />
    </div>
  );
}
