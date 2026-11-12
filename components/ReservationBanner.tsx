'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, X } from 'lucide-react';

export const RES_KEY = 'vh-reservation';
export const getReservation = (): { code: string; table: string } | null => { try { return JSON.parse(sessionStorage.getItem(RES_KEY) || 'null'); } catch { return null; } };
export const setReservation = (r: { code: string; table: string } | null) => { try { r ? sessionStorage.setItem(RES_KEY, JSON.stringify(r)) : sessionStorage.removeItem(RES_KEY); window.dispatchEvent(new Event('vh-reservation')); } catch {} };

// Shown on menu pages when the customer chose "Yes, order food" after booking a table.
export default function ReservationBanner() {
  const path = usePathname(); const [r, setR] = useState<{ code: string; table: string } | null>(null);
  useEffect(() => { const f = () => setR(getReservation()); f(); window.addEventListener('vh-reservation', f); return () => window.removeEventListener('vh-reservation', f); }, [path]);
  if (!r || !path.startsWith('/menu')) return null;
  return (
    <div className="fixed inset-x-0 top-[60px] z-30 flex items-center justify-center gap-3 border-b border-gold/30 bg-charcoal/95 px-4 py-2 text-sm backdrop-blur">
      <UtensilsCrossed size={16} className="shrink-0 text-gold" />
      <span>Ordering for your <b className="text-champagne">{r.table}</b> booking <span className="font-mono text-xs text-taupe">{r.code}</span> · served at your table</span>
      <button aria-label="Stop linking to this booking" title="Order for delivery instead" onClick={() => setReservation(null)} className="text-taupe hover:text-champagne"><X size={16} /></button>
    </div>
  );
}
