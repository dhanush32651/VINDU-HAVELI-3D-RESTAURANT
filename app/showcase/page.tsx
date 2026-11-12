import ThreeDShowcase from '@/components/ThreeDShowcase';
import DishCard from '@/components/DishCard';
import { SIGNATURE } from '@/data/dishes';
export default function Showcase() {
  return (
    <main className="section pt-28">
      <div className="mb-10 text-center"><p className="text-xs uppercase tracking-[0.5em] text-gold">Interactive</p><h1 className="mt-3 font-serif text-4xl md:text-6xl gold-text">The 3D Showcase</h1><p className="mt-3 text-taupe">Drag, scroll or tap a bowl to explore each signature biryani.</p></div>
      <ThreeDShowcase />
      <h2 className="mb-6 mt-16 font-serif text-3xl">Signature Biryanis</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{SIGNATURE.map((d) => <DishCard key={d.id} dish={d} />)}</div>
    </main>
  );
}
