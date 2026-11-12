'use client';
import { useEffect, useState } from 'react';
import FloorPlan, { TableView } from '../FloorPlan';
import { api } from '@/lib/client';
import { minutesLabel } from '@/lib/time';
import { usePoll } from './usePoll';

export default function TablesPanel() {
  const [pub, setPub] = useState<{ today: string } | null>(null); const [date, setDate] = useState(''); const [slots, setSlots] = useState<{ start: number; past: boolean }[]>([]); const [start, setStart] = useState<number | null>(null);
  useEffect(() => { api<{ today: string }>('/api/public-settings').then((p) => { setPub(p); setDate(p.today); }); }, []);
  useEffect(() => { if (!date) return; api<{ slots: any[] }>(`/api/tables?date=${date}&guests=1`).then((r) => { setSlots(r.slots); setStart((cur) => (cur !== null && r.slots.some((s) => s.start === cur) ? cur : (r.slots.find((s) => !s.past) ?? r.slots[0])?.start ?? null)); }).catch(() => setSlots([])); }, [date]);
  const { data, error } = usePoll(() => (start === null ? Promise.resolve(null) : api<{ tables: TableView[]; duration: number }>(`/api/owner/tables?date=${date}&start=${start}`)), 15000, [date, start]);
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs text-taupe">Date<input type="date" className="input mt-1" value={date} min={pub?.today} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
        <label className="text-xs text-taupe">Time<select className="input mt-1" value={start ?? ''} onChange={(e) => setStart(Number(e.target.value))}>{slots.map((s) => <option key={s.start} value={s.start}>{minutesLabel(s.start)}{s.past ? ' (passed)' : ''}</option>)}</select></label>
        {data && start !== null && <p className="pb-2 text-sm text-taupe">Showing {minutesLabel(start)} – {minutesLabel(start + data.duration)}</p>}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {data ? <FloorPlan tables={data.tables} showWho /> : <p className="text-taupe">Loading…</p>}
    </div>
  );
}
