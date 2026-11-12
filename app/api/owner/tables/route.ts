import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getSettings } from '@/lib/settings';
import { tableViews } from '@/lib/services/bookings';
import { isDate } from '@/lib/time';
import { ApiError, int } from '@/lib/validate';

export const GET = handle('owner', ({ req, db }) => {
  const q = new URL(req.url).searchParams; const date = q.get('date') ?? '';
  if (!isDate(date)) throw new ApiError(400, 'Choose a date.');
  const s = getSettings(db); const start = int(q.get('start'), 'Time', 0, 1439);
  return { tables: tableViews(db, date, start, start + s.booking_duration, 1, Date.now(), true), duration: s.booking_duration };
});
