'use client';
import Link from 'next/link';
import { Download, Printer, LayoutDashboard } from 'lucide-react';
import { LOGO_SRC } from './RestaurantLogo';
import { receiptHtml } from '@/lib/receipt-html';

async function logoData(): Promise<string | null> {
  try {
    const r = await fetch(LOGO_SRC); if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null;
    const blob = await r.blob();
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => res(null); fr.readAsDataURL(blob); });
  } catch { return null; }
}

export default function ReceiptActions({ kind, data, dashboard = true }: { kind: 'booking' | 'order'; data: any; dashboard?: boolean }) {
  const download = async () => {
    const html = receiptHtml(kind, data, await logoData());
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = `VINDU-HAVELI-${data.code}.html`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  return (
    <div className="no-print flex flex-wrap justify-center gap-3">
      <button className="btn-ghost" onClick={() => window.print()}><Printer size={16} />Print receipt</button>
      <button className="btn-ghost" onClick={download}><Download size={16} />Download receipt</button>
      {dashboard && <Link href="/dashboard" className="btn-gold"><LayoutDashboard size={16} />Return to dashboard</Link>}
    </div>
  );
}
