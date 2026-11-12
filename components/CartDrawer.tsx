'use client';
import { useState } from 'react';
import { Minus, Plus, Tag, X } from 'lucide-react';
import { totals, useStore } from '@/store/cartStore';
import { COUPONS } from '@/data/coupons';
export default function CartDrawer() {
  const s = useStore(); const [code, setCode] = useState('');
  const t = totals(s.items, s.coupon);
  return (
    <>
      <div onClick={() => s.setCart(false)} className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition ${s.cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gold/20 bg-charcoal transition-transform duration-300 ${s.cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gold/20 p-5"><h2 className="font-serif text-2xl gold-text">Your Order</h2><button aria-label="Close" onClick={() => s.setCart(false)}><X /></button></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {s.items.length === 0 && <p className="mt-10 text-center text-taupe">Your cart is empty.</p>}
          {s.items.map(({ dish, qty }) => (
            <div key={dish.id} className="flex items-center justify-between gap-3 rounded-xl border border-gold/15 p-3">
              <div><p className="font-serif text-lg leading-tight">{dish.name}</p><p className="text-sm text-gold">₹{dish.price * qty}</p></div>
              <div className="flex items-center gap-3"><button aria-label="Less" onClick={() => s.setQty(dish.id, qty - 1)} className="rounded-full border border-gold/40 p-1"><Minus size={14} /></button><span>{qty}</span><button aria-label="More" onClick={() => s.setQty(dish.id, qty + 1)} className="rounded-full border border-gold/40 p-1"><Plus size={14} /></button></div>
            </div>))}
        </div>
        {s.items.length > 0 && (
          <div className="space-y-3 border-t border-gold/20 p-5 text-sm">
            <div className="flex gap-2"><input className="input" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn-ghost" onClick={() => s.applyCoupon(code)}><Tag size={14} />Apply</button></div>
            {s.couponError && <p className="text-red-400">{s.couponError}</p>}
            {s.coupon && <p className="text-champagne">✓ {s.coupon} applied · <button className="underline" onClick={s.removeCoupon}>remove</button></p>}
            <p className="text-xs text-taupe">Try: {COUPONS.map((c) => c.code).join(', ')}</p>
            <Row l="Subtotal" v={t.subtotal} />{t.discount > 0 && <Row l="Discount" v={-t.discount} />}<Row l="GST (5%)" v={t.tax} /><Row l="Delivery" v={t.delivery} free />
            <div className="flex justify-between border-t border-gold/20 pt-3 font-serif text-2xl text-champagne"><span>Total</span><span>₹{t.total}</span></div>
            <button className="btn-gold w-full" onClick={() => s.setCheckout(true)}>Proceed to Checkout</button>
          </div>)}
      </aside>
    </>
  );
}
const Row = ({ l, v, free }: { l: string; v: number; free?: boolean }) => (<div className="flex justify-between text-taupe"><span>{l}</span><span>{free && v === 0 ? 'Free' : `${v < 0 ? '-' : ''}₹${Math.abs(v)}`}</span></div>);
