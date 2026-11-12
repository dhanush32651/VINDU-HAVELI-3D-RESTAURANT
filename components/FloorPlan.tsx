'use client';
import { Check, Users } from 'lucide-react';

export interface TableView { id: number; label: string; seats: number; state: 'available' | 'reserved' | 'occupied'; fits: boolean; booking?: { code: string; name: string; start_min: number; end_min: number; status: string; guests: number } }

const STATE_TEXT: Record<string, string> = { available: 'Available', selected: 'Selected', reserved: 'Reserved', occupied: 'Occupied' };

// Premium floor plan: eight small silver rectangular tables on a dark floor with gold accents.
export default function FloorPlan({ tables, selected, onSelect, showWho = false }: { tables: TableView[]; selected?: number | null; onSelect?: (id: number) => void; showWho?: boolean }) {
  return (
    <div>
      <div className="relative rounded-2xl border border-gold/40 bg-gradient-to-b from-[#14110c] to-[#0a0907] p-5 text-ivory shadow-[inset_0_0_60px_rgba(214,173,101,0.07)] sm:p-8" style={{ color: '#f4e8cb' }}>
        <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-[#d6ad65]/70"><span>Kitchen</span><span className="hidden sm:block">VINDU HAVELI · Dining Hall</span><span>Entrance</span></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
          {tables.map((t) => {
            const isSel = selected === t.id; const state = isSel ? 'selected' : t.state;
            const usable = t.state === 'available' && t.fits;
            return (
              <button key={t.id} type="button" disabled={!usable || !onSelect} onClick={() => usable && onSelect?.(t.id)} aria-pressed={isSel}
                aria-label={`${t.label}, seats ${t.seats}, ${STATE_TEXT[state]}${!t.fits ? ', too small for your party' : ''}`}
                className={`group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition ${usable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed'}`}>
                <span className="relative block h-16 w-full max-w-[120px] rounded-md transition sm:h-20" style={{
                  background: state === 'occupied' ? 'linear-gradient(145deg,#4a4a4a,#2c2c2c)' : state === 'reserved' ? 'linear-gradient(145deg,#8c8c8c,#5e5e5e)' : 'linear-gradient(145deg,#f3f4f6,#c0c4cc 45%,#8f959f)',
                  boxShadow: isSel ? '0 0 0 3px #d6ad65, 0 0 28px rgba(214,173,101,.65)' : usable ? '0 0 0 1px rgba(214,173,101,.35), 0 8px 18px rgba(0,0,0,.6)' : '0 6px 14px rgba(0,0,0,.6)',
                  opacity: usable || isSel ? 1 : 0.6 }}>
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 font-serif text-sm font-bold tracking-wider text-[#1a1408] sm:text-base" style={state === 'occupied' || state === 'reserved' ? { color: '#e5e5e5' } : undefined}>{t.label.replace('TABLE ', '')}</span>
                  {isSel && <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#d6ad65] text-black"><Check size={14} /></span>}
                </span>
                <span className="font-serif text-xs tracking-[0.2em] text-[#f2d69c]">{t.label}</span>
                <span className="flex items-center gap-1 text-[11px] text-[#aaa397]"><Users size={11} />{t.seats} seats</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${state === 'available' ? 'border-green-400/50 text-green-400' : state === 'selected' ? 'border-[#d6ad65] text-[#d6ad65]' : state === 'reserved' ? 'border-amber-400/50 text-amber-400' : 'border-red-400/50 text-red-400'}`}>{!t.fits && t.state === 'available' ? 'Too small' : STATE_TEXT[state]}</span>
                {showWho && t.booking && <span className="text-[10px] text-[#aaa397]">{t.booking.name} · {t.booking.guests}p</span>}
              </button>);
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-taupe">
        {[['bg-green-400', 'Available'], ['bg-[#d6ad65]', 'Selected'], ['bg-amber-400', 'Reserved'], ['bg-red-400', 'Occupied']].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${c}`} />{l}</span>)}
      </div>
    </div>
  );
}
