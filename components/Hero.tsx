'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { ALL_DISHES } from '@/data/dishes';
import DishImage from './DishImage';
import FoodVideoBackground from './FoodVideoBackground';
import RestaurantLogo from './RestaurantLogo';
export default function Hero() {
  const [q, setQ] = useState(''); const router = useRouter();
  const dots = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ left: `${(i * 37) % 100}%`, size: 2 + (i % 3), dur: 10 + (i % 7) * 3, delay: -(i % 9) * 2 })), []);
  const hero = ALL_DISHES[0];
  return (
    <FoodVideoBackground video="cooking" priority overlay={0.62} as="section" className="relative overflow-hidden pt-28 md:pt-36">
      <div className="pointer-events-none absolute inset-0">{dots.map((p, i) => <span key={i} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />)}</div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 md:grid-cols-2">
        <div>
          <div className="mb-5"><RestaurantLogo variant="hero" /></div>
          <p className="mb-4 text-xs uppercase tracking-[0.5em] text-gold">Royal Indian Hospitality</p>
          <h1 className="font-serif text-5xl font-semibold leading-tight md:text-7xl"><span className="gold-text">Curated Culinary Masterpieces</span></h1>
          <p className="mt-5 max-w-lg text-taupe">An extraordinary journey through the royal flavours of India. Order biryani, pizzas, burgers, desserts and more.</p>
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/menu?q=${encodeURIComponent(q)}`); }} className="mt-8 flex max-w-lg items-center gap-2 rounded-full border border-gold/40 bg-charcoal p-1.5 pl-4">
            <Search size={18} className="text-taupe" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a dish or drink…" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-taupe" /><button className="btn-gold">Search</button></form>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/menu" className="btn-gold">Order Now</Link><Link href="/showcase" className="btn-ghost">View in 3D</Link></div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/50" style={{ animation: 'spin 40s linear infinite' }} />
          <div className="absolute inset-5 overflow-hidden rounded-full border-4 border-gold shadow-glow"><DishImage dish={hero} className="h-full w-full" /></div>
        </div>
      </div>
    </FoodVideoBackground>
  );
}
