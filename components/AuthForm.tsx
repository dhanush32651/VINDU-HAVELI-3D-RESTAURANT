'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import RestaurantLogo from './RestaurantLogo';
import FoodVideoBackground from './FoodVideoBackground';
import { api } from '@/lib/client';

const safeNext = (n: string | null, role: string) => (n && n.startsWith('/') && !n.startsWith('//') && (role === 'owner') === n.startsWith('/owner') ? n : null);

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter(); const sp = useSearchParams(); const next = sp.get('next');
  const [f, setF] = useState({ name: '', email: '', phone: '', identifier: '', password: '', accountType: 'customer', inviteCode: '' });
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await api<{ user: { role: string }; redirect: string }>(mode === 'login' ? '/api/auth/login' : '/api/auth/signup',
        { body: mode === 'login' ? { identifier: f.identifier, password: f.password } : f });
      router.push(safeNext(next, r.user.role) ?? r.redirect); router.refresh();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <FoodVideoBackground video="interior" overlay={0.55} priority as="div" className="hidden flex-col items-center justify-center gap-6 p-12 text-center md:flex">
        <RestaurantLogo variant="hero" />
        <p className="max-w-sm font-serif text-2xl text-champagne">Royal flavours, reserved just for you.</p>
        <p className="max-w-xs text-sm text-taupe">Book a table, order your favourites and track every dish from kitchen to table.</p>
      </FoodVideoBackground>
      <div className="flex items-center justify-center px-5 pb-10 pt-24">
        <form onSubmit={submit} className="panel w-full max-w-md space-y-4 p-7">
          <div className="flex justify-center md:hidden"><RestaurantLogo variant="auth" /></div>
          <h1 className="font-serif text-3xl gold-text">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          {mode === 'signup' && (<>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
              {[['customer', 'Customer'], ['owner', 'Restaurant Owner']].map(([v, l]) => (
                <button type="button" key={v} role="radio" aria-checked={f.accountType === v} onClick={() => set('accountType', v)} className={`rounded-xl border p-3 text-sm transition ${f.accountType === v ? 'border-gold bg-gold/10 text-champagne' : 'border-gold/20 text-taupe'}`}>{l}</button>))}
            </div>
            {f.accountType === 'owner' && <div><input className="input" placeholder="Owner invitation code" value={f.inviteCode} onChange={(e) => set('inviteCode', e.target.value)} autoComplete="off" /><p className="mt-1 text-xs text-taupe">Restaurant owner accounts need the private invitation code set up by the site administrator.</p></div>}
            <input className="input" placeholder="Full name" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" required />
            <input className="input" type="email" placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" required />
            <input className="input" placeholder="10-digit mobile number" inputMode="numeric" value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} autoComplete="tel" required />
          </>)}
          {mode === 'login' && <input className="input" placeholder="Email or mobile number" value={f.identifier} onChange={(e) => set('identifier', e.target.value)} autoComplete="username" required />}
          <div className="relative">
            <input className="input !pr-10" type={show ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Password (8+ characters, letters & numbers)' : 'Password'} value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
            <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          {err && <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</p>}
          <button disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}{mode === 'login' ? 'Log in' : 'Create account'}</button>
          <div className="flex justify-between text-sm text-taupe">
            {mode === 'login' ? <><Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="hover:text-champagne">Create an account</Link><Link href="/forgot-password" className="hover:text-champagne">Forgot password?</Link></>
              : <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="hover:text-champagne">Already have an account? Log in</Link>}
          </div>
        </form>
      </div>
    </main>
  );
}
