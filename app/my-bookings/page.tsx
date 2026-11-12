import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { getDb } from '@/lib/db';
import { listUserBookings, expireHolds } from '@/lib/services/bookings';
import CancelBookingButton from '@/components/CancelBookingButton';
import { BOOKING_PAY, BOOKING_STATUS, plain } from '@/lib/labels';
import { dateLabel, minutesLabel } from '@/lib/time';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Bookings | VINDU HAVELI' };

export default function MyBookings() {
  const user = requireRole('customer', '/my-bookings'); const db = getDb(); expireHolds(db);
  const bookings = plain(listUserBookings(db, user.id)).filter((b: any) => b.status !== 'held');
  return (
    <main className="section pt-28">
      <h1 className="font-serif text-4xl md:text-5xl gold-text">My Bookings</h1>
      <div className="mt-8 space-y-4">
        {bookings.length === 0 && <p className="panel p-8 text-center text-taupe">No bookings yet. <Link href="/book-dine" className="text-gold underline">Book a table</Link></p>}
        {bookings.map((b: any) => (
          <div key={b.code} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
            <div><p className="font-mono text-champagne">{b.code}</p><p className="font-serif text-xl">{b.table_label} · {b.guests} guests</p><p className="text-sm text-taupe">{dateLabel(b.booking_date)} · {minutesLabel(b.start_min)} – {minutesLabel(b.end_min)}</p><p className="text-xs text-taupe">Advance ₹{b.advance_paise / 100} · {BOOKING_PAY[b.payment_status]}</p>
              {b.status_reason && <p className="text-xs text-red-400">{b.status_reason}</p>}</div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${BOOKING_STATUS[b.status][1]}`}>{BOOKING_STATUS[b.status][0]}</span>
              <Link href={`/bookings/${b.code}`} className="text-sm text-gold underline">View / print receipt</Link>
              {['pending', 'confirmed'].includes(b.status) && <CancelBookingButton code={b.code} />}
            </div>
          </div>))}
      </div>
    </main>
  );
}
