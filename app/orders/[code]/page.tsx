import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/session';
import { getDb } from '@/lib/db';
import { getOrderByCode } from '@/lib/services/orders';
import OrderReceipt from '@/components/OrderReceipt';
import { plain } from '@/lib/labels';
export const dynamic = 'force-dynamic';
export default function OrderPage({ params }: { params: { code: string } }) {
  const user = requireRole('customer', `/orders/${params.code}`);
  const o = getOrderByCode(getDb(), params.code);
  if (!o || o.user_id !== user.id) notFound();
  return (<main className="section pt-28"><h1 className="mb-8 text-center font-serif text-4xl gold-text">Your Order</h1><OrderReceipt initial={plain(o)} /></main>);
}
