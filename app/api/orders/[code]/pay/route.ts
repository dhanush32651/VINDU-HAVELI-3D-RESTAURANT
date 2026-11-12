import { handle } from '@/lib/api';
import { getOrderByCode } from '@/lib/services/orders';
import { createIntent } from '@/lib/services/payments';
import { ApiError } from '@/lib/validate';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Retry online payment for an order that is still awaiting payment.
export const POST = handle('customer', async ({ db, user, params }) => {
  const o = getOrderByCode(db, params.code);
  if (!o || o.user_id !== user!.id) throw new ApiError(404, 'Order not found.');
  if (o.payment_status !== 'pending') throw new ApiError(409, 'This order does not need a payment.');
  return { order: o, intent: await createIntent(db, { purpose: 'order', refId: o.id, userId: user!.id, amountPaise: o.total * 100, receipt: o.code }) };
});
