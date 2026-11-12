import { CheckCircle2 } from 'lucide-react';
import RestaurantLogo from './RestaurantLogo';
import { bookingRows } from '@/lib/receipt-html';
import { RESTAURANT as R } from '@/data/restaurant';

// Paper-style receipt (fixed light colours so it prints well in any site theme).
export default function BookingReceipt({ booking }: { booking: any }) {
  const paid = booking.payment_status === 'paid';
  return (
    <div className="print-area mx-auto w-full max-w-lg rounded-2xl border-2 border-[#b8893a] bg-[#fffdf7] p-6 text-[#2a2113] shadow-xl sm:p-8">
      <div className="border-b border-dashed border-[#b8893a] pb-4 text-center">
        <div className="flex justify-center"><RestaurantLogo variant="receipt" paper /></div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em]">Table Booking Receipt</p>
      </div>
      <dl className="mt-3 divide-y divide-[#eadfc4] text-sm">
        {bookingRows(booking).map(([k, v]) => (
          <div key={k} className="grid grid-cols-[42%_1fr] gap-2 py-2"><dt className="text-[#6b5b3e]">{k}</dt><dd className={`font-semibold ${k === 'Booking ID' ? 'font-mono' : ''}`}>{v}</dd></div>))}
      </dl>
      {booking.payment_status === 'demo' && <p className="mt-3 rounded-lg border border-amber-600/40 bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-900">DEMO MODE – this advance was not actually charged. Live payments are not enabled.</p>}
      {(booking.status === 'rejected' || booking.status === 'cancelled') && booking.status_reason && <p className="mt-3 text-center text-sm text-red-700">Reason: {booking.status_reason}</p>}
      <p className="mt-5 flex items-center justify-center gap-2 text-center font-semibold">{paid && <CheckCircle2 size={18} className="text-green-700" />}Please show this booking receipt when you arrive at the restaurant.</p>
      <p className="mt-4 text-center text-xs leading-relaxed text-[#6b5b3e]">{R.address}<br />{R.phone} · {R.hours}</p>
    </div>
  );
}
