'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, ChefHat, LayoutGrid, Settings, ShoppingBag } from 'lucide-react';
import RestaurantLogo from '../RestaurantLogo';
import LogoutButton from '../LogoutButton';
import ReservationsPanel from './ReservationsPanel';
import OrdersPanel from './OrdersPanel';
import KitchenView from './KitchenView';
import TablesPanel from './TablesPanel';
import SettingsPanel from './SettingsPanel';

const TABS = [['res', 'Reservations', CalendarCheck], ['orders', 'Food Orders', ShoppingBag], ['kitchen', 'Kitchen', ChefHat], ['tables', 'Tables', LayoutGrid], ['settings', 'Settings', Settings]] as const;

export default function OwnerDashboard({ name }: { name: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('res');
  return (
    <main className="section pt-28">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2"><RestaurantLogo variant="dashboard" /><h1 className="font-serif text-3xl md:text-4xl gold-text">Owner Dashboard</h1><p className="text-sm text-taupe">Signed in as {name}</p></div>
        <div className="flex gap-2"><Link href="/owner/kitchen" className="btn-ghost !py-2"><ChefHat size={16} />Kitchen screen</Link><LogoutButton /></div>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gold/20 pb-3" role="tablist">
        {TABS.map(([k, l, I]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`chip flex items-center gap-2 ${tab === k ? 'chip-on' : ''}`}><I size={15} />{l}</button>)}
      </div>
      <div className="mt-6">
        {tab === 'res' && <ReservationsPanel />}{tab === 'orders' && <OrdersPanel />}{tab === 'kitchen' && <KitchenView />}{tab === 'tables' && <TablesPanel />}{tab === 'settings' && <SettingsPanel />}
      </div>
    </main>
  );
}
