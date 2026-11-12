'use client';
import { useEffect, useRef } from 'react';
// Circular cursor that follows the mouse and grows over links/buttons (desktop only).
export default function CursorRing() {
  const ring = useRef<HTMLDivElement>(null); const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    let x = 0, y = 0, cx = 0, cy = 0, big = false, raf = 0;
    const move = (e: MouseEvent) => { x = e.clientX; y = e.clientY; big = !!(e.target as HTMLElement).closest?.('a,button,input,textarea,[role=button]');
      if (ring.current) ring.current.style.opacity = '1'; if (dot.current) { dot.current.style.opacity = '1'; dot.current.style.transform = `translate(${x - 3}px,${y - 3}px)`; } };
    const loop = () => { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; if (ring.current) ring.current.style.transform = `translate(${cx - 18}px,${cy - 18}px) scale(${big ? 1.7 : 1})`; raf = requestAnimationFrame(loop); };
    window.addEventListener('mousemove', move); raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); document.documentElement.classList.remove('has-cursor'); };
  }, []);
  return (<><div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[100] h-9 w-9 rounded-full border-2 border-gold opacity-0 transition-[opacity,scale] duration-200" /><div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-gold opacity-0" /></>);
}
