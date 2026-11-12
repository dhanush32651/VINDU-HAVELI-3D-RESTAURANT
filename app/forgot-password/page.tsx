import Link from 'next/link';
import { Phone } from 'lucide-react';
import RestaurantLogo from '@/components/RestaurantLogo';
import { RESTAURANT as R } from '@/data/restaurant';
export const metadata = { title: 'Forgot password | VINDU HAVELI' };
export default function ForgotPassword() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 pb-10 pt-24">
      <div className="panel w-full max-w-md space-y-4 p-7 text-center">
        <div className="flex justify-center"><RestaurantLogo variant="auth" /></div>
        <h1 className="font-serif text-3xl gold-text">Forgot your password?</h1>
        <p className="text-taupe">We do not send codes by email or SMS. Call the restaurant with your registered email or mobile number and our team will set a temporary password for you. You can then log in and keep it.</p>
        <a href={R.phoneHref} className="btn-gold w-full"><Phone size={16} />{R.phone}</a>
        <Link href="/login" className="block text-sm text-taupe hover:text-champagne">← Back to log in</Link>
      </div>
    </main>
  );
}
