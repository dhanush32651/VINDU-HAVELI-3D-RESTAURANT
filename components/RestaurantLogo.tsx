'use client';
import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

// Shows /public/images/branding/restaurant-logo.png when it exists and loads.
// Otherwise shows the original VINDU HAVELI text branding. Never a broken image, never an empty gap.
export const LOGO_SRC = '/images/branding/restaurant-logo.png';
let known: 'unknown' | 'ok' | 'fail' = 'unknown';
let pending: Promise<boolean> | null = null;
function probe(): Promise<boolean> {
  if (known !== 'unknown') return Promise.resolve(known === 'ok');
  pending ??= new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => { known = img.naturalWidth > 0 ? 'ok' : 'fail'; resolve(known === 'ok'); };
    img.onerror = () => { known = 'fail'; resolve(false); };
    img.src = LOGO_SRC;
  });
  return pending;
}

type Variant = 'nav' | 'hero' | 'auth' | 'dashboard' | 'footer' | 'receipt';
const IMG: Record<Variant, string> = {
  nav: 'max-h-9 max-w-[150px] sm:max-w-[190px]', hero: 'max-h-20 max-w-[260px] md:max-h-28 md:max-w-[360px]', auth: 'max-h-16 max-w-[240px]',
  dashboard: 'max-h-12 max-w-[200px]', footer: 'max-h-14 max-w-[220px]', receipt: 'max-h-16 max-w-[220px]',
};
const TEXT: Record<Variant, string> = {
  nav: 'text-xl', hero: 'text-3xl md:text-4xl', auth: 'text-3xl', dashboard: 'text-xl', footer: 'text-2xl', receipt: 'text-2xl',
};

export default function RestaurantLogo({ variant = 'dashboard', className = '', paper = false }: { variant?: Variant; className?: string; paper?: boolean }) {
  const [ok, setOk] = useState(known === 'ok');
  useEffect(() => { let live = true; probe().then((v) => live && setOk(v)); return () => { live = false; }; }, []);
  if (ok) {
    // Natural size is preserved: only a maximum height/width is set, so nothing is stretched or cropped.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={LOGO_SRC} alt="VINDU HAVELI logo" onError={() => { known = 'fail'; setOk(false); }} className={`block h-auto w-auto object-contain ${IMG[variant]} ${className}`} />;
  }
  const word = <span className={`font-serif tracking-[0.2em] ${TEXT[variant]} ${paper ? 'text-[#8a6416]' : 'gold-text'} ${variant === 'nav' ? 'hidden sm:block' : ''}`}>VINDU HAVELI</span>;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="img" aria-label="VINDU HAVELI">
      {variant === 'nav' && <span className="grid h-9 w-9 place-items-center rounded-full border border-gold text-gold"><Crown size={18} /></span>}
      {variant === 'receipt' && <Crown size={22} className="text-[#8a6416]" />}
      {word}
    </span>
  );
}
