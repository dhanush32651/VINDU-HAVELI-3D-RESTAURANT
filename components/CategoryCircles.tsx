import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { ALL_DISHES } from '@/data/dishes';
import DishImage from './DishImage';
export default function CategoryCircles() {
  return (
    <section className="section !py-10">
      <h2 className="mb-6 font-serif text-3xl md:text-4xl">What is on your mind?</h2>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/menu/${c.slug}`} className="group flex w-24 shrink-0 flex-col items-center gap-2 md:w-32">
            <span className="block h-24 w-24 overflow-hidden rounded-full border-2 border-gold/50 transition duration-300 group-hover:scale-110 group-hover:border-gold group-hover:shadow-glow md:h-32 md:w-32"><DishImage dish={ALL_DISHES.find((d) => d.id === c.cover)!} className="h-full w-full" /></span>
            <span className="text-center text-sm font-medium text-champagne">{c.label}</span>
          </Link>))}
      </div>
    </section>
  );
}
