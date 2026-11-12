import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/session';
import { getDb } from '@/lib/db';
import { getBookingByCode } from '@/lib/services/bookings';
import BookingReceipt from '@/components/BookingReceipt';
import ReceiptActions from '@/components/ReceiptActions';
import { plain } from '@/lib/labels';
export const dynamic = 'force-dynamic';
export default function BookingPage({ params }: { params: { code: string } }) {
  const user = requireRole('customer', `/bookings/${params.code}`);
  const b = getBookingByCode(getDb(), params.code);
  if (!b || b.user_id !== user.id || b.status === 'expired') notFound();
  return (<main className="section space-y-6 pt-28"><h1 className="text-center font-serif text-4xl gold-text no-print">Booking Receipt</h1><BookingReceipt booking={plain(b)} /><ReceiptActions kind="booking" data={plain(b)} /></main>);
}
