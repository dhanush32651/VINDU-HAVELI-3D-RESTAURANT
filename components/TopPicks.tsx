'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TOP_PICKS } from '@/data/dishes';
import DishCard from './DishCard';
export default function TopPicks() {
  const ref = useRef<HTMLDivElement>(null); const go = (d: number) => ref.current?.scrollBy({ left: d * 300, behavior: 'smooth' });
  return (
    <section className="section !py-10">
      <div className="mb-6 flex items-end justify-between"><h2 className="font-serif text-3xl md:text-4xl">Highly Ordered</h2>
        <div className="flex gap-2"><button aria-label="Previous" onClick={() => go(-1)} className="rounded-full border border-gold/50 p-2 text-champagne"><ChevronLeft size={18} /></button><button aria-label="Next" onClick={() => go(1)} className="rounded-full border border-gold/50 p-2 text-champagne"><ChevronRight size={18} /></button></div></div>
      <div ref={ref} className="flex snap-x gap-5 overflow-x-auto pb-4">{TOP_PICKS.map((d) => <div key={d.id} className="w-[270px] shrink-0 snap-start"><DishCard dish={d} /></div>)}</div>
    </section>
  );
}
