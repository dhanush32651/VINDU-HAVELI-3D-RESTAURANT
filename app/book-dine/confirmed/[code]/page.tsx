import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/session';
import { getDb } from '@/lib/db';
import { getBookingByCode } from '@/lib/services/bookings';
import BookingReceipt from '@/components/BookingReceipt';
import ReceiptActions from '@/components/ReceiptActions';
import OrderPrompt from '@/components/OrderPrompt';
import { plain } from '@/lib/labels';
export const dynamic = 'force-dynamic';
export default function Confirmed({ params }: { params: { code: string } }) {
  const user = requireRole('customer', `/book-dine/confirmed/${params.code}`);
  const b = getBookingByCode(getDb(), params.code);
  if (!b || b.user_id !== user.id) notFound();
  if (b.payment_status !== 'paid' && b.payment_status !== 'demo') redirect('/book-dine'); // never show a success page for an unpaid booking
  return (
    <main className="section space-y-8 pt-28">
      <OrderPrompt code={b.code} table={b.table_label} />
      <BookingReceipt booking={plain(b)} />
      <ReceiptActions kind="booking" data={plain(b)} />
    </main>
  );
}
