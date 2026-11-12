import Link from 'next/link';
import { Phone, MapPin, Clock } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import RestaurantLogo from './RestaurantLogo';
export default function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-charcoal">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2"><RestaurantLogo variant="footer" /><p className="mt-3 max-w-sm text-sm text-taupe">Royal Indian hospitality, served fresh. Biryanis, pizzas, burgers, desserts and more, delivered to your door.</p>
          <ul className="mt-5 space-y-2 text-sm text-taupe"><li className="flex gap-2"><Phone size={16} className="text-gold" /><a href="tel:+918019585772" className="hover:text-champagne">+91 80195 85772</a></li><li className="flex gap-2"><MapPin size={16} className="text-gold" />Vindu Haveli, [Your street, city, PIN]</li><li className="flex gap-2"><Clock size={16} className="text-gold" />Daily 11:00 AM – 11:30 PM</li></ul></div>
        <div><p className="mb-3 font-semibold text-champagne">Explore</p><ul className="space-y-2 text-sm text-taupe">{[['Home', '/'], ['Full Menu', '/menu'], ['3D Showcase', '/showcase'], ['Book Dine', '/book-dine'], ['Offers', '/offers'], ['Contact', '/contact'], ['Login', '/login']].map(([l, h]) => <li key={h}><Link href={h} className="hover:text-champagne">{l}</Link></li>)}</ul></div>
        <div><p className="mb-3 font-semibold text-champagne">Categories</p><ul className="space-y-2 text-sm text-taupe">{CATEGORIES.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/menu/${c.slug}`} className="hover:text-champagne">{c.label}</Link></li>)}</ul></div>
      </div>
      <p className="border-t border-gold/15 py-5 text-center text-xs text-taupe">© {new Date().getFullYear()} VINDU HAVELI. All rights reserved. · FSSAI Lic. No. [add yours]</p>
    </footer>
  );
}
