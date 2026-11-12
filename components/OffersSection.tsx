'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { COUPONS } from '@/data/coupons';
export default function OffersSection() {
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="grid gap-5 md:grid-cols-3">{COUPONS.map((c) => (
      <div key={c.code} className="panel border-dashed p-6 text-center"><p className="font-serif text-3xl text-champagne">{c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}</p><p className="mt-2 min-h-10 text-sm text-taupe">{c.label}</p>
        <button className="btn-ghost mt-4" onClick={() => { navigator.clipboard?.writeText(c.code); setDone(c.code); setTimeout(() => setDone(null), 1500); }}>{done === c.code ? <Check size={14} /> : <Copy size={14} />}{c.code}</button></div>))}</div>
  );
}
