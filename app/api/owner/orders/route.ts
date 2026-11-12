import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { ownerListOrders } from '@/lib/services/orders';

export const GET = handle('owner', ({ req, db }) => {
  const q = new URL(req.url).searchParams;
  return { orders: ownerListOrders(db, { status: q.get('status') || undefined, active: q.get('active') === '1' }) };
});
