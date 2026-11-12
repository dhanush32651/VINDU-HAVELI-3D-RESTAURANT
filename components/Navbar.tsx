'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Moon, Search, ShoppingBag, Sun, Sunset, User, X } from 'lucide-react';
import RestaurantLogo from './RestaurantLogo';
import { totals, useStore } from '@/store/cartStore';
const LINKS = [['Home', '/'], ['Menu', '/menu'], ['Book Dine', '/book-dine'], ['3D Showcase', '/showcase'], ['Offers', '/offers'], ['Contact', '/contact']];
const THEMES = [['light', Sun], ['evening', Sunset], ['dark', Moon]] as const;
export default function Navbar() {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [theme, setTheme] = useState('dark'); const [scrolled, setScrolled] = useState(false);
  const path = usePathname(); const router = useRouter();
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  useEffect(() => { fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => setMe(d.user)).catch(() => setMe(null)); }, [path]);
  const items = useStore((s) => s.items); const setCart = useStore((s) => s.setCart); const count = totals(items, null).count;
  useEffect(() => { setTheme(document.documentElement.dataset.theme || 'dark'); const f = () => setScrolled(window.scrollY > 20); f(); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => setOpen(false), [path]);
  const pick = (t: string) => { setTheme(t); document.documentElement.dataset.theme = t; try { localStorage.setItem('vh-theme', t); } catch {} };
  const search = (e: React.FormEvent) => { e.preventDefault(); router.push(`/menu?q=${encodeURIComponent(q)}`); setOpen(false); };
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition ${scrolled || open ? 'border-b border-gold/20 bg-charcoal/85 backdrop-blur-xl' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="VINDU HAVELI home"><RestaurantLogo variant="nav" /></Link>
        <form onSubmit={search} className="relative hidden flex-1 md:block lg:max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search biryani, pizza, mojito…" className="input !rounded-full !pl-9" /></form>
        <ul className="ml-auto hidden gap-6 lg:flex">{LINKS.map(([l, h]) => (<li key={h}><Link href={h} className={`text-sm transition hover:text-champagne ${path === h ? 'text-gold' : ''}`}>{l}</Link></li>))}</ul>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <div className="flex rounded-full border border-gold/40 p-0.5">{THEMES.map(([t, I]) => <button key={t} aria-label={`${t} theme`} onClick={() => pick(t)} className={`rounded-full p-1.5 ${theme === t ? 'bg-gold text-royal' : 'text-taupe'}`}><I size={14} /></button>)}</div>
          <button aria-label="Open cart" onClick={() => setCart(true)} className="relative rounded-full border border-gold/50 p-2.5 text-champagne hover:shadow-glow"><ShoppingBag size={18} />{count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-royal">{count}</span>}</button>
          <Link href={me ? (me.role === 'owner' ? '/owner/dashboard' : '/dashboard') : '/login'} className="hidden items-center gap-1.5 rounded-full border border-gold/50 px-3 py-2 text-sm text-champagne hover:shadow-glow sm:flex" aria-label={me ? 'My account' : 'Log in'}><User size={16} />{me ? me.name.split(' ')[0] : 'Login'}</Link>
          <button aria-label="Menu" className="text-champagne lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </nav>
      {open && (<div className="space-y-2 px-4 pb-5 lg:hidden"><form onSubmit={search} className="md:hidden"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes…" className="input !rounded-full" /></form>{LINKS.map(([l, h]) => (<Link key={h} href={h} className="block rounded-lg px-3 py-2 hover:bg-gold/10">{l}</Link>))}<Link href={me ? (me.role === 'owner' ? '/owner/dashboard' : '/dashboard') : '/login'} className="block rounded-lg px-3 py-2 font-semibold text-gold hover:bg-gold/10">{me ? `My account (${me.name.split(' ')[0]})` : 'Login / Sign up'}</Link></div>)}
    </header>
  );
}
