// Owner-configurable settings, stored in the database. Defaults come from the environment, then from this file.
import { Db } from './db';

export interface Settings {
  advance_amount: number;      // rupees
  booking_duration: number;    // minutes a table is blocked for
  open_minutes: number;        // 660 = 11:00
  close_minutes: number;       // 1410 = 23:30
  slot_interval: number;       // minutes between bookable start times
  hold_minutes: number;        // how long an unpaid booking holds the table
  max_advance_days: number;    // how far ahead customers may book
  auto_confirm: number;        // 1 = paid bookings are confirmed automatically; 0 = owner must accept
}
const envNum = (k: string, d: number) => { const v = Number(process.env[k]); return Number.isFinite(v) && process.env[k] ? v : d; };
export const defaultSettings = (): Settings => ({
  advance_amount: envNum('DEFAULT_ADVANCE_AMOUNT', 200),
  booking_duration: envNum('DEFAULT_BOOKING_DURATION_MIN', 90),
  open_minutes: 11 * 60, close_minutes: 23 * 60 + 30, slot_interval: 30,
  hold_minutes: 10, max_advance_days: 30, auto_confirm: 0,
});
const LIMITS: Record<keyof Settings, [number, number]> = {
  advance_amount: [1, 100000], booking_duration: [30, 480], open_minutes: [0, 1439], close_minutes: [1, 1440],
  slot_interval: [15, 120], hold_minutes: [3, 60], max_advance_days: [1, 365], auto_confirm: [0, 1],
};
export function getSettings(db: Db): Settings {
  const s: any = defaultSettings();
  for (const r of db.prepare('SELECT key, value FROM settings').all()) if (r.key in s && Number.isFinite(Number(r.value))) s[r.key] = Number(r.value);
  return s;
}
export function updateSettings(db: Db, patch: Record<string, unknown>): Settings {
  const cur = getSettings(db); const next: any = { ...cur };
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in LIMITS)) continue;
    const n = Number(v); const [lo, hi] = LIMITS[k as keyof Settings];
    if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`${k} must be a whole number between ${lo} and ${hi}.`);
    next[k] = n;
  }
  if (next.close_minutes - next.open_minutes < next.booking_duration) throw new Error('Opening hours are shorter than the booking duration.');
  const up = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const k of Object.keys(LIMITS)) up.run(k, String(next[k]));
  return next;
}
