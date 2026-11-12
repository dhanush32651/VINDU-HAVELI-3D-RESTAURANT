import { Suspense } from 'react';
import MenuBrowser from '@/components/MenuBrowser';
export default function MenuPage() {
  return (<main className="section pt-28"><h1 className="mb-8 font-serif text-4xl md:text-6xl gold-text">Our Menu</h1><Suspense fallback={null}><MenuBrowser /></Suspense></main>);
}
