'use client';
import { Minus, Plus, Star } from 'lucide-react';
import { Dish } from '@/types/restaurant';
import { useStore } from '@/store/cartStore';
import DishImage from './DishImage';
import Spice from './Spice';
import VegMark from './VegMark';
export default function DishCard({ dish }: { dish: Dish }) {
  const qty = useStore((s) => s.items.find((i) => i.dish.id === dish.id)?.qty ?? 0);
  const add = useStore((s) => s.add); const setQty = useStore((s) => s.setQty);
  return (
    <article className="panel group w-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-gold/60">
      <div className="relative">
        <DishImage dish={dish} className="h-44 w-full transition duration-500 group-hover:scale-105" />
        <span className="absolute left-2 top-2"><VegMark veg={dish.veg} /></span>
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-green-700 px-1.5 py-0.5 text-xs font-semibold text-white">{dish.rating.toFixed(1)}<Star size={10} fill="currentColor" /></span>
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">{(dish.orders / 1000).toFixed(1)}k ordered</span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2"><h3 className="font-serif text-lg leading-snug">{dish.name}</h3><span className="font-semibold text-gold">₹{dish.price}</span></div>
        <Spice level={dish.spice} />
        <p className="line-clamp-2 min-h-10 text-sm text-taupe">{dish.description}</p>
        {qty === 0 ? <button className="btn-ghost w-full !py-2" onClick={() => add(dish)}>ADD</button> : (
          <div className="flex items-center justify-between rounded-full border border-gold px-2 py-1.5">
            <button aria-label="Less" onClick={() => setQty(dish.id, qty - 1)} className="rounded-full p-1 text-gold"><Minus size={16} /></button><span className="font-semibold">{qty}</span>
            <button aria-label="More" onClick={() => add(dish)} className="rounded-full p-1 text-gold"><Plus size={16} /></button></div>)}
      </div>
    </article>
  );
}
