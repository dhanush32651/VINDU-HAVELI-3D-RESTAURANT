'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

const toHM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const fromHM = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

export default function SettingsPanel() {
  const [s, setS] = useState<any>(null); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [rp, setRp] = useState({ identifier: '', password: '' }); const [rpMsg, setRpMsg] = useState('');
  useEffect(() => { api<{ settings: any }>('/api/owner/settings').then((r) => setS(r.settings)).catch((e) => setErr(e.message)); }, []);
  if (!s) return <p className="text-taupe">{err || 'Loading…'}</p>;
  const num = (k: string, label: string, hint: string) => <label className="block text-sm text-taupe">{label}<input type="number" className="input mt-1" value={s[k]} onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })} /><span className="text-xs opacity-70">{hint}</span></label>;
  const save = async () => { setMsg(''); setErr(''); try { const r = await api<{ settings: any }>('/api/owner/settings', { method: 'PATCH', body: s }); setS(r.settings); setMsg('Saved. New bookings use these settings immediately.'); } catch (e: any) { setErr(e.message); } };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel space-y-4 p-5">
        <h3 className="font-serif text-2xl text-champagne">Table booking settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {num('advance_amount', 'Advance amount (₹)', 'Default ₹200')}
          {num('booking_duration', 'Booking duration (minutes)', 'How long a table is blocked')}
          <label className="block text-sm text-taupe">Opens<input type="time" className="input mt-1" value={toHM(s.open_minutes)} onChange={(e) => setS({ ...s, open_minutes: fromHM(e.target.value) })} /></label>
          <label className="block text-sm text-taupe">Last booking ends by<input type="time" className="input mt-1" value={toHM(s.close_minutes)} onChange={(e) => setS({ ...s, close_minutes: fromHM(e.target.value) })} /></label>
          {num('slot_interval', 'Time slot interval (minutes)', 'e.g. 30')}
          {num('hold_minutes', 'Payment hold (minutes)', 'Unpaid bookings release the table after this')}
          {num('max_advance_days', 'Book up to (days ahead)', '')}
          <label className="flex items-center gap-3 self-center text-sm"><input type="checkbox" checked={!!s.auto_confirm} onChange={(e) => setS({ ...s, auto_confirm: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-[#D6AD65]" />Auto-confirm paid bookings<br /><span className="text-xs text-taupe">Off = you accept or reject each one</span></label>
        </div>
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}{msg && <p className="text-sm text-green-400">{msg}</p>}
        <button className="btn-gold" onClick={save}>Save settings</button>
      </section>
      <section className="panel space-y-3 p-5">
        <h3 className="font-serif text-2xl text-champagne">Help a customer who forgot their password</h3>
        <p className="text-sm text-taupe">Enter their registered email or mobile number and set a temporary password (8+ characters with a letter and a number). Tell it to them by phone. They are signed out everywhere.</p>
        <input className="input" placeholder="Customer email or mobile" value={rp.identifier} onChange={(e) => setRp({ ...rp, identifier: e.target.value })} />
        <input className="input" placeholder="Temporary password" value={rp.password} onChange={(e) => setRp({ ...rp, password: e.target.value })} />
        <button className="btn-ghost" onClick={async () => { setRpMsg(''); try { const r = await api<{ name: string }>('/api/owner/reset-password', { body: rp }); setRpMsg(`Password updated for ${r.name}.`); setRp({ identifier: '', password: '' }); } catch (e: any) { setRpMsg(e.message); } }}>Set temporary password</button>
        {rpMsg && <p className="text-sm text-champagne">{rpMsg}</p>}
      </section>
    </div>
  );
}
