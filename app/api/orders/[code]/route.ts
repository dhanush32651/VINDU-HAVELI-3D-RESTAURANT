import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getOrderByCode } from '@/lib/services/orders';
import { ApiError } from '@/lib/validate';

export const GET = handle('user', ({ db, user, params }) => {
  const o = getOrderByCode(db, params.code);
  if (!o || (user!.role !== 'owner' && o.user_id !== user!.id)) throw new ApiError(404, 'Order not found.');
  return { order: o };
});
