'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
export default function CancelBookingButton({ code }: { code: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  return (
    <span>
      <button disabled={busy} className="text-sm text-red-400 underline disabled:opacity-50" onClick={async () => {
        if (!confirm('Cancel this booking? If you paid an advance, the restaurant will process your refund.')) return;
        setBusy(true); setErr(''); try { await api(`/api/bookings/${code}`, { method: 'DELETE' }); router.refresh(); } catch (e: any) { setErr(e.message); } setBusy(false);
      }}>{busy ? 'Cancelling…' : 'Cancel booking'}</button>
      {err && <span className="ml-2 text-xs text-red-400">{err}</span>}
    </span>
  );
}
