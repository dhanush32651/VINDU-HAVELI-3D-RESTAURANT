'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { ALL_DISHES } from '@/data/dishes';
import { CATEGORIES } from '@/data/categories';
import DishCard from './DishCard';
const PRICES: [string, number, number][] = [['Any price', 0, 9999], ['Under ₹150', 0, 149], ['₹150–300', 150, 300], ['₹300–450', 300, 450], ['₹450+', 450, 9999]];
export default function MenuBrowser({ category }: { category?: string }) {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? ''); const [diet, setDiet] = useState<'all' | 'veg' | 'non'>('all');
  const [price, setPrice] = useState(0); const [top, setTop] = useState(false); const [rated, setRated] = useState(false); const [sort, setSort] = useState('orders'); const [cat, setCat] = useState('all');
  const active = category ?? cat;
  const list = useMemo(() => {
    const [, lo, hi] = PRICES[price]; const s = q.trim().toLowerCase();
    return ALL_DISHES.filter((d) => (active === 'all' || d.category === active) && (!s || (d.name + ' ' + d.description + ' ' + d.category).toLowerCase().includes(s))
      && (diet === 'all' || (diet === 'veg') === d.veg) && d.price >= lo && d.price <= hi && (!top || d.orders >= 1500) && (!rated || d.rating >= 4.5))
      .sort((a, b) => sort === 'orders' ? b.orders - a.orders : sort === 'rating' ? b.rating - a.rating : sort === 'low' ? a.price - b.price : b.price - a.price);
  }, [q, diet, price, top, rated, sort, active]);
  return (
    <div>
      <div className="panel sticky top-[60px] z-30 mb-8 space-y-3 p-4">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes, drinks, categories…" className="input !pl-9" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'veg', 'non'] as const).map((d) => <button key={d} onClick={() => setDiet(d)} className={`chip ${diet === d ? 'chip-on' : ''}`}>{d === 'all' ? 'All' : d === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}</button>)}
          <button onClick={() => setTop(!top)} className={`chip ${top ? 'chip-on' : ''}`}>🔥 Highly ordered</button>
          <button onClick={() => setRated(!rated)} className={`chip ${rated ? 'chip-on' : ''}`}>⭐ 4.5+</button>
          {PRICES.map(([l], i) => <button key={l} onClick={() => setPrice(i)} className={`chip ${price === i ? 'chip-on' : ''}`}>{l}</button>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!category && <div className="flex gap-2 overflow-x-auto"><button onClick={() => setCat('all')} className={`chip ${cat === 'all' ? 'chip-on' : ''}`}>All</button>{CATEGORIES.map((c) => <button key={c.slug} onClick={() => setCat(c.slug)} className={`chip ${cat === c.slug ? 'chip-on' : ''}`}>{c.emoji} {c.label}</button>)}</div>}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !w-auto"><option value="orders">Most ordered</option><option value="rating">Top rated</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
        </div>
      </div>
      <p className="mb-4 text-sm text-taupe">{list.length} items</p>
      {list.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((d) => <DishCard key={d.id} dish={d} />)}</div> : <p className="py-20 text-center text-taupe">No dishes match. Try clearing a filter.</p>}
      {category && <p className="mt-10 text-center"><Link href="/menu" className="btn-ghost">Browse full menu</Link></p>}
    </div>
  );
}
