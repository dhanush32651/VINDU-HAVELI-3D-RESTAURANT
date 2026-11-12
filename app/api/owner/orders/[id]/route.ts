import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { ownerOrderRefunded, ownerSetOrderStatus } from '@/lib/services/orders';
import { int, optStr } from '@/lib/validate';

export const PATCH = handle('owner', ({ db, params, body }) => {
  const id = int(params.id, 'id', 1, 1e9);
  if (body.action === 'refunded') return { order: ownerOrderRefunded(db, id) };
  return { order: ownerSetOrderStatus(db, id, String(body.status ?? ''), optStr(body.reason, 'Reason', 300)) };
});
