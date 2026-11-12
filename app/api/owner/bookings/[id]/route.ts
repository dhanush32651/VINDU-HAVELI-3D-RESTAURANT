import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { ownerMarkRefunded, ownerSetStatus } from '@/lib/services/bookings';
import { int, optStr } from '@/lib/validate';

export const PATCH = handle('owner', ({ db, params, body }) => {
  const id = int(params.id, 'id', 1, 1e9);
  if (body.action === 'refunded') return { booking: ownerMarkRefunded(db, id) };
  return { booking: ownerSetStatus(db, id, String(body.status ?? ''), optStr(body.reason, 'Reason', 300)) };
});
