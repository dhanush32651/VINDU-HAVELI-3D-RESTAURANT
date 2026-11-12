import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import MenuBrowser from '@/components/MenuBrowser';
import { CATEGORIES } from '@/data/categories';
import { CATEGORY_VIDEO } from '@/data/videos';
import FoodVideoBackground from '@/components/FoodVideoBackground';
export const generateStaticParams = () => CATEGORIES.map((c) => ({ slug: c.slug }));
export default function CategoryPage({ params }: { params: { slug: string } }) {
  const c = CATEGORIES.find((x) => x.slug === params.slug); if (!c) notFound();
  return (<main className="section pt-28"><FoodVideoBackground video={CATEGORY_VIDEO[c.slug] ?? 'cooking'} fallbackImage={`/images/${c.cover}.jpg`} overlay={0.6} className="mb-8 overflow-hidden rounded-2xl border border-gold/20 p-8"><p className="text-3xl">{c.emoji}</p><h1 className="font-serif text-4xl md:text-6xl gold-text">{c.label}</h1><p className="mt-2 max-w-2xl text-taupe">{c.blurb}</p></FoodVideoBackground><Suspense fallback={null}><MenuBrowser category={c.slug} /></Suspense></main>);
}
