'use client';
import { useRouter } from 'next/navigation';
import { PartyPopper } from 'lucide-react';
import { setReservation } from './ReservationBanner';

// Shown right after a successful table booking.
export default function OrderPrompt({ code, table }: { code: string; table: string }) {
  const router = useRouter();
  return (
    <section className="panel no-print mx-auto max-w-2xl space-y-5 p-8 text-center">
      <PartyPopper className="mx-auto text-gold" size={40} />
      <h1 className="font-serif text-2xl text-champagne md:text-3xl">Your table has been booked successfully! Would you also like to order something?</h1>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button className="btn-gold" onClick={() => { setReservation({ code, table }); router.push('/menu'); }}>YES — ORDER FOOD</button>
        <button className="btn-ghost" onClick={() => { setReservation(null); router.push('/dashboard'); }}>NO — GO TO DASHBOARD</button>
      </div>
    </section>
  );
}
