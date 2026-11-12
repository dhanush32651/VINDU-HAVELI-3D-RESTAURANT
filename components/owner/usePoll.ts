'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
// Loads data now, then again every `ms` milliseconds (and whenever `deps` change).
export function usePoll<T>(load: () => Promise<T>, ms: number, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null); const [error, setError] = useState('');
  const ref = useRef(load); ref.current = load;
  const refresh = useCallback(() => ref.current().then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); const t = setInterval(refresh, ms); return () => clearInterval(t); }, [ms, refresh, ...deps]);
  return { data, error, refresh };
}
export function beep() {
  try { const C = window.AudioContext || (window as any).webkitAudioContext; const c = new C(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); setTimeout(() => { o.stop(); c.close(); }, 350); } catch {}
}
