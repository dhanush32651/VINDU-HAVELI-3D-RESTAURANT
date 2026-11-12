'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, X, Crown } from 'lucide-react';
import { QUICK_REPLIES, FaqLink } from '@/data/faqs';
import { ChatReply, answer, answerById, fillTokens } from '@/lib/chatbot';

interface Msg { from: 'bot' | 'me'; text: string; links?: FaqLink[]; suggestions?: { label: string; faq: string }[] }
const USE_API = process.env.NEXT_PUBLIC_CHAT_API === 'true'; // flip on once /api/chat talks to a real AI

export default function ChatWidget() {
  const [open, setOpen] = useState(false); const [text, setText] = useState(''); const [typing, setTyping] = useState(false);
  const [vars, setVars] = useState<Record<string, string | number>>({ advance: 200, duration: 90, hours: '11:00 AM – 11:30 PM' });
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: 'Namaste! 🙏 I am the VINDU HAVELI assistant. Ask me anything about our menu, offers, table bookings or orders.' }]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch('/api/public-settings').then((r) => r.json()).then((s) => s?.advance && setVars({ advance: s.advance, duration: s.duration, hours: s.hours })).catch(() => {}); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing, open]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);

  const push = (r: ChatReply) => setMsgs((m) => [...m, { from: 'bot', text: fillTokens(r.text, vars), links: r.links, suggestions: r.suggestions }]);
  const reply = (get: () => Promise<ChatReply> | ChatReply) => {
    setTyping(true);
    setTimeout(async () => { let r: ChatReply; try { r = await get(); } catch { r = answer(''); } setTyping(false); push(r); }, 450);
  };
  const ask = (q: string) => {
    const t = q.trim(); if (!t) return; setMsgs((m) => [...m, { from: 'me', text: t }]); setText('');
    reply(() => (USE_API ? fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: t }) }).then((r) => r.json()) : answer(t)));
  };
  const quick = (label: string, faq: string) => { setMsgs((m) => [...m, { from: 'me', text: label }]); reply(() => answerById(faq)); };

  return (
    <>
      <button aria-label={open ? 'Close chat' : 'Open chat assistant'} onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[45] grid h-14 w-14 place-items-center rounded-full text-royal shadow-glow transition-transform duration-300 hover:scale-110 no-print"
        style={{ backgroundImage: 'linear-gradient(120deg, rgb(var(--gold)), rgb(var(--champagne)))' }}>
        <span className={`absolute transition-all duration-300 ${open ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`}><X size={24} /></span>
        <span className={`absolute transition-all duration-300 ${open ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}><MessageCircle size={26} /></span>
      </button>
      <section role="dialog" aria-label="VINDU HAVELI chat assistant" aria-hidden={!open}
        className={`fixed bottom-24 right-3 z-[45] flex h-[min(540px,calc(100vh-7rem))] w-[calc(100vw-1.5rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-2xl border border-gold/30 bg-charcoal shadow-2xl transition-all duration-300 sm:right-5 no-print ${open ? 'scale-100 opacity-100' : 'invisible pointer-events-none scale-90 opacity-0'}`}
        style={open ? { animation: 'chatIn .3s ease-out' } : undefined}>
        <header className="flex items-center gap-3 border-b border-gold/20 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-gold text-gold"><Crown size={16} /></span>
          <div className="flex-1"><p className="font-serif text-lg leading-none gold-text">Haveli Assistant</p><p className="mt-1 text-[11px] text-taupe">Menu · Offers · Bookings · Orders</p></div>
          <button aria-label="Close chat" onClick={() => setOpen(false)} className="text-taupe hover:text-champagne"><X size={18} /></button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`msg-in flex flex-col gap-2 ${m.from === 'me' ? 'items-end' : 'items-start'}`}>
              <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 leading-relaxed ${m.from === 'me' ? 'rounded-br-sm bg-gold text-royal' : 'rounded-bl-sm border border-gold/20 bg-royal'}`}>{m.text}</p>
              {m.links && m.links.length > 0 && <div className="flex flex-wrap gap-2">{m.links.map((l) => l.href.startsWith('tel:')
                ? <a key={l.href + l.label} href={l.href} className="btn-ghost !px-3 !py-1.5 !text-xs">{l.label}</a>
                : <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} className="btn-ghost !px-3 !py-1.5 !text-xs">{l.label}</Link>)}</div>}
              {m.suggestions && m.suggestions.length > 0 && i === msgs.length - 1 && <div className="flex flex-wrap gap-2">{m.suggestions.map((s) => <button key={s.faq} onClick={() => quick(s.label, s.faq)} className="chip !py-1 !text-xs">{s.label}</button>)}</div>}
            </div>))}
          {typing && <div className="flex gap-1 px-2 py-3" aria-label="Assistant is typing">{[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${d * 0.15}s` }} />)}</div>}
          <div ref={end} />
        </div>
        <div className="flex gap-2 overflow-x-auto border-t border-gold/15 px-3 py-2">{QUICK_REPLIES.map((q) => <button key={q.label} onClick={() => quick(q.label, q.faq)} className="chip !py-1 !text-xs whitespace-nowrap">{q.label}</button>)}</div>
        <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 border-t border-gold/20 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Type your question…" aria-label="Your question" className="input !rounded-full" />
          <button aria-label="Send" className="btn-gold !px-3.5"><Send size={16} /></button>
        </form>
      </section>
    </>
  );
}
