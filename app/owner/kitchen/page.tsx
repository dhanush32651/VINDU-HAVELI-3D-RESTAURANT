import Link from 'next/link';
import { requireRole } from '@/lib/session';
import KitchenView from '@/components/owner/KitchenView';
import RestaurantLogo from '@/components/RestaurantLogo';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kitchen | VINDU HAVELI' };
export default function Page() {
  requireRole('owner', '/owner/kitchen');
  return (<main className="section pt-28"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="space-y-2"><RestaurantLogo variant="dashboard" /><h1 className="font-serif text-3xl gold-text">Kitchen Orders</h1></div><Link href="/owner/dashboard" className="btn-ghost">← Dashboard</Link></div><KitchenView /></main>);
}
