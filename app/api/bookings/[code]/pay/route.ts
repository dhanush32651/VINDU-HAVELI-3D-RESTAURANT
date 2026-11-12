import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getBookingByCode } from '@/lib/services/bookings';
import { createIntent } from '@/lib/services/payments';
import { ApiError } from '@/lib/validate';

// Retry payment for a booking whose table is still being held.
export const POST = handle('customer', async ({ db, user, params }) => {
  const b = getBookingByCode(db, params.code);
  if (!b || b.user_id !== user!.id) throw new ApiError(404, 'Booking not found.');
  if (b.status !== 'held' || b.hold_expires_at <= Date.now()) throw new ApiError(409, 'This booking is no longer being held. Please start a new booking.');
  return { booking: b, intent: await createIntent(db, { purpose: 'booking', refId: b.id, userId: user!.id, amountPaise: b.advance_paise, receipt: b.code }) };
});
