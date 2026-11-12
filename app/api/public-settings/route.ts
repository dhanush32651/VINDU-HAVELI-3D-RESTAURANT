import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getSettings } from '@/lib/settings';
import { payMode } from '@/lib/services/payments';
import { minutesLabel, nowInTz } from '@/lib/time';
import { TZ } from '@/lib/services/bookings';

export const GET = handle('public', ({ db }) => {
  const s = getSettings(db);
  return { advance: s.advance_amount, duration: s.booking_duration, hours: `${minutesLabel(s.open_minutes)} – ${minutesLabel(s.close_minutes)}`, maxDays: s.max_advance_days, today: nowInTz(TZ()).date, payMode: payMode(), autoConfirm: !!s.auto_confirm };
});
