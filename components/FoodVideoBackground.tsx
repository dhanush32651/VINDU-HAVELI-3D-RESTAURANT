'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { VIDEOS, VideoKey } from '@/data/videos';

interface Props {
  video: VideoKey;
  /** Shown (dimmed) if the video is missing or cannot play. Without it a soft themed gradient is used. */
  fallbackImage?: string;
  /** 0..1 darkness of the overlay that keeps text readable. */
  overlay?: number;
  /** Load immediately (use for the first screen). Others load when they scroll near the viewport. */
  priority?: boolean;
  as?: 'div' | 'section';
  className?: string;
  children?: ReactNode;
}

// GIF-like background video: muted, looping, autoplay, inline on phones, object-fit: cover, no controls.
// While the video is not playing, `data-media` is "image" or "none" and the section looks exactly as before;
// once it plays, `data-media="video"` switches the section to light-on-dark colours (see globals.css).
export default function FoodVideoBackground({ video, fallbackImage, overlay = 0.6, priority = false, as = 'div', className = '', children }: Props) {
  const root = useRef<HTMLDivElement>(null); const vid = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(priority); const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false); const [failed, setFailed] = useState(false); const [imgOk, setImgOk] = useState(!!fallbackImage);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saver = (navigator as any).connection?.saveData;
    if (reduce || saver) setAllowed(false);
  }, []);
  useEffect(() => {
    const el = root.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const load = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); load.disconnect(); } }, { rootMargin: '300px' });
    const play = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    load.observe(el); play.observe(el);
    return () => { load.disconnect(); play.disconnect(); };
  }, []);
  useEffect(() => {
    const v = vid.current; if (!v) return;
    v.muted = true; v.defaultMuted = true; // React does not always reflect the muted attribute; autoplay needs it
    const sync = () => { if (visible && !document.hidden) v.play().catch(() => {}); else v.pause(); };
    sync(); document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [visible, near, allowed, failed]);

  const playing = ready && !failed;
  const state = playing ? 'video' : fallbackImage && imgOk ? 'image' : 'none';
  const Tag: any = as;
  return (
    <Tag ref={root} data-media={state} className={`relative isolate ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {state !== 'video' && (fallbackImage && imgOk
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={fallbackImage} alt="" onError={() => setImgOk(false)} className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 15%, rgb(var(--gold) / .14), transparent 60%), radial-gradient(ellipse at 85% 85%, rgb(var(--champagne) / .08), transparent 55%)' }} />)}
        {near && allowed && !failed && (
          <video ref={vid} src={`/videos/${VIDEOS[video]}`} autoPlay muted loop playsInline disablePictureInPicture tabIndex={-1}
            preload={priority ? 'auto' : 'metadata'} onLoadedData={() => setReady(true)} onPlaying={() => setReady(true)} onError={() => setFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`} />
        )}
        {state !== 'none' && <div className="absolute inset-0 bg-black" style={{ opacity: overlay }} />}
      </div>
      {children}
    </Tag>
  );
}
