import Link from 'next/link';
import Hero from '@/components/Hero';
import CategoryCircles from '@/components/CategoryCircles';
import TopPicks from '@/components/TopPicks';
import AboutRestaurant from '@/components/AboutRestaurant';
import FoodVideoBackground from '@/components/FoodVideoBackground';
export default function Home() {
  return (
    <main>
      <Hero /><CategoryCircles /><TopPicks />
      <section className="section !py-10"><FoodVideoBackground video="biryani" overlay={0.65} className="overflow-hidden rounded-2xl border border-gold/20"><div className="flex flex-col items-center gap-4 p-10 text-center"><h2 className="font-serif text-3xl md:text-4xl gold-text">Five Royal Biryanis in 3D</h2><p className="max-w-xl text-taupe">Spin through our signature biryani bowls and order your favourite.</p><Link href="/showcase" className="btn-gold">Open 3D Showcase</Link></div></FoodVideoBackground></section>
      <section className="section !py-10"><FoodVideoBackground video="interior" overlay={0.65} className="overflow-hidden rounded-2xl border border-gold/20"><div className="flex flex-col items-center gap-4 p-10 text-center"><h2 className="font-serif text-3xl md:text-4xl gold-text">Reserve Your Table</h2><p className="max-w-xl text-taupe">Choose one of our eight tables for a royal evening, with a small advance to secure it.</p><Link href="/book-dine" className="btn-gold">Book Dine</Link></div></FoodVideoBackground></section>
      <AboutRestaurant />
    </main>
  );
}
