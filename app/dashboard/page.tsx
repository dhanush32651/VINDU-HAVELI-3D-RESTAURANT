import Link from 'next/link';
import { CalendarCheck, ShoppingBag, ArrowRight, ClipboardList } from 'lucide-react';
import { requireRole } from '@/lib/session';
import { getDb } from '@/lib/db';
import { listUserBookings, expireHolds } from '@/lib/services/bookings';
import { listUserOrders } from '@/lib/services/orders';
import RestaurantLogo from '@/components/RestaurantLogo';
import FoodVideoBackground from '@/components/FoodVideoBackground';
import OrdersLive from '@/components/OrdersLive';
import LogoutButton from '@/components/LogoutButton';
import { BOOKING_STATUS, plain } from '@/lib/labels';
import { dateLabel, minutesLabel } from '@/lib/time';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Dashboard | VINDU HAVELI' };

export default function Dashboard() {
  const user = requireRole('customer', '/dashboard'); const db = getDb(); expireHolds(db);
  const bookings = plain(listUserBookings(db, user.id)).filter((b: any) => b.status !== 'held').slice(0, 3);
  const orders = plain(listUserOrders(db, user.id));
  return (
    <main className="section pt-28">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2"><RestaurantLogo variant="dashboard" /><h1 className="font-serif text-3xl md:text-5xl gold-text">Welcome, {user.name.split(' ')[0]}</h1><p className="text-taupe">What would you like to do today?</p></div>
        <LogoutButton />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {([['/book-dine', 'BOOK DINE', 'Reserve one of our eight tables for a royal evening.', CalendarCheck, 'interior'], ['/menu', 'ORDER FOOD', 'Browse the menu and have your favourites delivered.', ShoppingBag, 'cooking']] as const).map(([href, t, d, I, v]) => (
          <Link key={href} href={href} className="group block overflow-hidden rounded-2xl border border-gold/30 transition hover:border-gold hover:shadow-glow">
            <FoodVideoBackground video={v} overlay={0.62} as="div" className="flex min-h-[220px] flex-col justify-end gap-2 p-7">
              <I size={34} className="text-gold" /><h2 className="font-serif text-3xl tracking-[0.15em] gold-text md:text-4xl">{t}</h2><p className="max-w-sm text-taupe">{d}</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-champagne">Continue <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </FoodVideoBackground>
          </Link>))}
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">Recent bookings</h2><Link href="/my-bookings" className="text-sm text-gold underline">All bookings</Link></div>
          {bookings.length === 0 ? <p className="panel p-6 text-center text-taupe">No bookings yet.</p> : <div className="space-y-3">{bookings.map((b: any) => (
            <Link key={b.code} href={`/bookings/${b.code}`} className="panel flex flex-wrap items-center justify-between gap-2 p-4 hover:border-gold/60">
              <div><p className="font-mono text-sm text-champagne">{b.code}</p><p className="text-sm text-taupe">{b.table_label} · {dateLabel(b.booking_date)} · {minutesLabel(b.start_min)}</p></div>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${BOOKING_STATUS[b.status][1]}`}>{BOOKING_STATUS[b.status][0]}</span></Link>))}</div>}
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">Recent orders</h2><Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gold underline"><ClipboardList size={14} />All orders</Link></div>
          <OrdersLive initial={orders} limit={3} />
        </section>
      </div>
    </main>
  );
}
