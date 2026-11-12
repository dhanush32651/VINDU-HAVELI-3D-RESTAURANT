import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyRazorpay } from '@/lib/services/payments';

export const POST = handle('user', async ({ db, user, body }) => {
  const { payment, result } = await verifyRazorpay(db, user!.id, body);
  return { purpose: payment.purpose, code: (result as any).code };
});
