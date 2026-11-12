import { requireRole } from '@/lib/session';
import FoodVideoBackground from '@/components/FoodVideoBackground';
import RestaurantLogo from '@/components/RestaurantLogo';
import BookDineFlow from '@/components/BookDineFlow';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Book Dine | VINDU HAVELI' };

export default function BookDine() {
  const user = requireRole('customer', '/book-dine');
  return (
    <main>
      <FoodVideoBackground video="interior" overlay={0.6} priority as="section" className="px-5 pb-12 pt-32 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4"><RestaurantLogo variant="dashboard" /><h1 className="font-serif text-4xl md:text-6xl gold-text">BOOK DINE</h1><p className="text-taupe">Choose your evening, pick one of our eight tables and secure it with a small advance.</p></div>
      </FoodVideoBackground>
      <div className="section !pt-10"><BookDineFlow user={{ name: user.name, phone: user.phone, email: user.email }} /></div>
    </main>
  );
}
