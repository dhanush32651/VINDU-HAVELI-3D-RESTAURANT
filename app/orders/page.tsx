import { requireRole } from '@/lib/session';
import { getDb } from '@/lib/db';
import { listUserOrders } from '@/lib/services/orders';
import OrdersLive from '@/components/OrdersLive';
import { plain } from '@/lib/labels';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Orders | VINDU HAVELI' };
export default function Orders() {
  const user = requireRole('customer', '/orders');
  return (<main className="section pt-28"><h1 className="font-serif text-4xl md:text-5xl gold-text">My Orders</h1><p className="mb-8 mt-2 text-taupe">Status updates appear here automatically.</p><OrdersLive initial={plain(listUserOrders(getDb(), user.id))} /></main>);
}
