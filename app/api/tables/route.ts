import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getSettings } from '@/lib/settings';
import { listSlots, tableViews } from '@/lib/services/bookings';
import { int } from '@/lib/validate';

// Public: which of the 8 tables are free for a date/time/guest count. No customer details are exposed.
export const GET = handle('public', ({ req, db }) => {
  const q = new URL(req.url).searchParams; const date = q.get('date') ?? ''; const guests = int(q.get('guests') ?? 2, 'Guests', 1, 20);
  const s = getSettings(db);
  if (!q.get('start')) return { slots: listSlots(db, date, guests), duration: s.booking_duration, advance: s.advance_amount };
  const start = int(q.get('start'), 'Time', 0, 1439);
  listSlots(db, date, guests); // validates the date window
  return { tables: tableViews(db, date, start, start + s.booking_duration, guests), duration: s.booking_duration, advance: s.advance_amount };
});
