import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { createBooking, listUserBookings, expireHolds } from '@/lib/services/bookings';
import { createIntent } from '@/lib/services/payments';
import { ApiError } from '@/lib/validate';

export const GET = handle('customer', ({ db, user }) => { expireHolds(db); return { bookings: listUserBookings(db, user!.id) }; });

export const POST = handle('customer', async ({ db, user, body }) => {
  const booking = createBooking(db, user!, body);
  try {
    const intent = await createIntent(db, { purpose: 'booking', refId: booking.id, userId: user!.id, amountPaise: booking.advance_paise, receipt: booking.code });
    return { booking, intent };
  } catch (e) {
    db.prepare("UPDATE reservations SET status = 'expired' WHERE id = ?").run(booking.id); // payment could not even start: free the table
    throw e;
  }
});
