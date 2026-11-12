import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { demoConfirm } from '@/lib/services/payments';
import { int } from '@/lib/validate';

// Only works while no Razorpay keys are configured. The result is stored as 'demo', never as 'paid'.
export const POST = handle('user', ({ db, user, body }) => {
  const { payment, result } = demoConfirm(db, user!.id, int(body.paymentId, 'paymentId', 1, 1e9));
  return { purpose: payment.purpose, code: (result as any).code };
});
