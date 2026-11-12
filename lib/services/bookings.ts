import crypto from 'node:crypto';
import { Db, tx } from '../db';
import { Settings, getSettings } from '../settings';
import { ApiError, bad, int, optStr, phone as vPhone, str } from '../validate';
import { DEFAULT_TZ, daysBetween, isDate, nowInTz } from '../time';
import { PublicUser } from './auth';

export const TZ = () => process.env.RESTAURANT_TIMEZONE || DEFAULT_TZ;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const makeCode = (prefix: string) => `${prefix}-` + Array.from({ length: 6 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');

/** Statuses that block a table for the booking's time window. */
export const BLOCKING = ['pending', 'confirmed', 'seated'] as const;
const BLOCK_SQL = `(status IN ('pending','confirmed','seated') OR (status = 'held' AND hold_expires_at > ?))`;

export type TableState = 'available' | 'reserved' | 'occupied';
export interface TableView { id: number; label: string; seats: number; state: TableState; fits: boolean; booking?: { code: string; name: string; start_min: number; end_min: number; status: string; guests: number } }

export function expireHolds(db: Db, now = Date.now()) {
  db.prepare("UPDATE reservations SET status = 'expired', updated_at = ? WHERE status = 'held' AND hold_expires_at <= ?").run(new Date(now).toISOString(), now);
}

/** All valid start times for a date, with how many tables are still free for each. */
export function listSlots(db: Db, date: string, guests: number, now = Date.now()) {
  const s = getSettings(db); const t = nowInTz(TZ(), now);
  validateDate(date, s, t.date);
  const out: { start: number; free: number; past: boolean }[] = [];
  for (let m = s.open_minutes; m + s.booking_duration <= s.close_minutes; m += s.slot_interval) {
    const past = date === t.date && m <= t.minutes;
    out.push({ start: m, free: past ? 0 : tableViews(db, date, m, m + s.booking_duration, guests, now).filter((x) => x.state === 'available' && x.fits).length, past });
  }
  return out;
}

function validateDate(date: string, s: Settings, today: string) {
  if (!isDate(date)) throw bad('Please choose a valid date.');
  const d = daysBetween(today, date);
  if (d < 0) throw bad('Please choose today or a future date.');
  if (d > s.max_advance_days) throw bad(`Bookings open up to ${s.max_advance_days} days ahead.`);
}

export function tableViews(db: Db, date: string, start: number, end: number, guests: number, now = Date.now(), withDetails = false): TableView[] {
  expireHolds(db, now);
  const tables = db.prepare('SELECT * FROM dining_tables ORDER BY id').all();
  const rows = db.prepare(`SELECT * FROM reservations WHERE booking_date = ? AND start_min < ? AND end_min > ? AND ${BLOCK_SQL}`).all(date, end, start, now);
  return tables.map((t: any) => {
    const hits = rows.filter((r: any) => r.table_id === t.id);
    const seated = hits.find((r: any) => r.status === 'seated');
    const first = seated ?? hits[0];
    const v: TableView = { id: t.id, label: t.label, seats: t.seats, state: seated ? 'occupied' : hits.length ? 'reserved' : 'available', fits: guests <= t.seats };
    if (withDetails && first) v.booking = { code: first.code, name: first.customer_name, start_min: first.start_min, end_min: first.end_min, status: first.status, guests: first.guests };
    return v;
  });
}

export interface BookingInput { date: unknown; start: unknown; guests: unknown; tableId: unknown; name: unknown; phone: unknown; notes?: unknown }

/** Creates a 'held' reservation. The overlap check and the insert happen inside one exclusive transaction. */
export function createBooking(db: Db, user: PublicUser, input: BookingInput, now = Date.now()) {
  const s = getSettings(db); const today = nowInTz(TZ(), now);
  const date = String(input.date ?? ''); validateDate(date, s, today.date);
  const start = int(input.start, 'Time', 0, 1439); const guests = int(input.guests, 'Number of guests', 1, 20); const tableId = int(input.tableId, 'Table', 1, 8);
  const end = start + s.booking_duration;
  if (start < s.open_minutes || end > s.close_minutes || (start - s.open_minutes) % s.slot_interval !== 0) throw bad('That time is outside our booking hours.');
  if (date === today.date && start <= today.minutes) throw bad('That time has already passed. Please pick a later slot.');
  const name = str(input.name, 'Name', 80, 2); const phone = vPhone(input.phone); const notes = optStr(input.notes, 'Notes', 300);
  return tx(db, () => {
    expireHolds(db, now);
    const table = db.prepare('SELECT * FROM dining_tables WHERE id = ?').get(tableId);
    if (!table) throw bad('Unknown table.');
    if (guests > table.seats) throw bad(`${table.label} seats ${table.seats}. Please choose a larger table for ${guests} guests.`);
    const clash = db.prepare(`SELECT 1 FROM reservations WHERE table_id = ? AND booking_date = ? AND start_min < ? AND end_min > ? AND ${BLOCK_SQL}`).get(tableId, date, end, start, now);
    if (clash) throw new ApiError(409, `${table.label} is already reserved for that time. Please choose another table or time.`);
    const iso = new Date(now).toISOString();
    let code = makeCode('VH-BK');
    const r = db.prepare(`INSERT INTO reservations (code, user_id, table_id, booking_date, start_min, end_min, guests, customer_name, customer_phone, notes, status, payment_status, advance_paise, hold_expires_at, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?, 'held', 'unpaid', ?, ?, ?, ?)`).run(code, user.id, tableId, date, start, end, guests, name, phone, notes, s.advance_amount * 100, now + s.hold_minutes * 60_000, iso, iso);
    return getBookingById(db, Number(r.lastInsertRowid))!;
  });
}

const SELECT = `SELECT r.*, t.label AS table_label, t.seats AS table_seats, u.email AS customer_email FROM reservations r JOIN dining_tables t ON t.id = r.table_id JOIN users u ON u.id = r.user_id`;
export const getBookingById = (db: Db, id: number) => db.prepare(`${SELECT} WHERE r.id = ?`).get(id);
export const getBookingByCode = (db: Db, code: string) => db.prepare(`${SELECT} WHERE r.code = ?`).get(code);
export const listUserBookings = (db: Db, userId: number) => db.prepare(`${SELECT} WHERE r.user_id = ? AND r.status NOT IN ('expired') ORDER BY r.booking_date DESC, r.start_min DESC`).all(userId);

/** Called only after the payment has been verified (or demo-confirmed). */
export function markBookingPaid(db: Db, bookingId: number, demo: boolean, now = Date.now()) {
  const s = getSettings(db);
  const out = tx(db, () => {
    const b = db.prepare('SELECT * FROM reservations WHERE id = ?').get(bookingId);
    if (!b) throw new ApiError(404, 'Booking not found.');
    if (b.payment_status === 'paid' || b.payment_status === 'demo') return { booking: getBookingById(db, bookingId), conflict: false };
    if (b.status === 'held' || b.status === 'expired') {
      // A verified payment arrived: re-check the slot is still free (the hold may have lapsed) before confirming.
      const clash = db.prepare(`SELECT 1 FROM reservations WHERE id != ? AND table_id = ? AND booking_date = ? AND start_min < ? AND end_min > ? AND ${BLOCK_SQL}`).get(bookingId, b.table_id, b.booking_date, b.end_min, b.start_min, now);
      if (clash) {
        db.prepare("UPDATE reservations SET status = 'rejected', payment_status = ?, status_reason = ?, updated_at = ? WHERE id = ?")
          .run(demo ? 'demo' : 'refund_pending', 'Table was taken before payment completed.' + (demo ? '' : ' Refund due.'), new Date(now).toISOString(), bookingId);
        return { booking: null, conflict: true }; // committed first, then reported, so the refund flag is not rolled back
      }
    }
    db.prepare('UPDATE reservations SET status = ?, payment_status = ?, hold_expires_at = NULL, updated_at = ? WHERE id = ?')
      .run(s.auto_confirm ? 'confirmed' : 'pending', demo ? 'demo' : 'paid', new Date(now).toISOString(), bookingId);
    return { booking: getBookingById(db, bookingId), conflict: false };
  });
  if (out.conflict) throw new ApiError(409, 'Sorry, this table was taken before your payment completed. Any amount charged will be refunded.');
  return out.booking;
}

const OWNER_NEXT: Record<string, string[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['seated', 'completed', 'cancelled', 'no_show', 'rejected'],
  seated: ['completed'],
};
export function ownerSetStatus(db: Db, id: number, status: string, reason: string, now = Date.now()) {
  const b = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id); if (!b) throw new ApiError(404, 'Booking not found.');
  if (!(OWNER_NEXT[b.status] ?? []).includes(status)) throw bad(`A ${b.status} booking cannot be changed to ${status}.`);
  if ((status === 'rejected' || status === 'cancelled') && !reason.trim()) throw bad('Please give a reason.');
  const refund = (status === 'rejected' || status === 'cancelled') && (b.payment_status === 'paid' || b.payment_status === 'demo');
  db.prepare('UPDATE reservations SET status = ?, payment_status = ?, status_reason = ?, updated_at = ? WHERE id = ?')
    .run(status, refund && b.payment_status === 'paid' ? 'refund_pending' : b.payment_status, reason.trim().slice(0, 300), new Date(now).toISOString(), id);
  return getBookingById(db, id);
}
export function ownerMarkRefunded(db: Db, id: number, now = Date.now()) {
  const b = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id); if (!b) throw new ApiError(404, 'Booking not found.');
  if (b.payment_status !== 'refund_pending') throw bad('No refund is pending for this booking.');
  db.prepare("UPDATE reservations SET payment_status = 'refunded', updated_at = ? WHERE id = ?").run(new Date(now).toISOString(), id);
  return getBookingById(db, id);
}

/** Customers may cancel their own upcoming booking. A paid advance becomes 'refund_pending' for the owner to process. */
export function customerCancel(db: Db, user: PublicUser, code: string, now = Date.now()) {
  const b = db.prepare('SELECT * FROM reservations WHERE code = ? AND user_id = ?').get(code, user.id);
  if (!b) throw new ApiError(404, 'Booking not found.');
  if (!['held', 'pending', 'confirmed'].includes(b.status)) throw bad('This booking can no longer be cancelled online. Please call the restaurant.');
  db.prepare("UPDATE reservations SET status = 'cancelled', payment_status = ?, status_reason = 'Cancelled by customer', hold_expires_at = NULL, updated_at = ? WHERE id = ?")
    .run(b.payment_status === 'paid' ? 'refund_pending' : b.payment_status, new Date(now).toISOString(), b.id);
  return getBookingByCode(db, code);
}

export function ownerListBookings(db: Db, f: { date?: string; q?: string }) {
  const where: string[] = ["r.status NOT IN ('expired','held')"]; const args: any[] = [];
  if (f.date) { where.push('r.booking_date = ?'); args.push(f.date); }
  if (f.q) { where.push('(r.code LIKE ? OR r.customer_name LIKE ? OR r.customer_phone LIKE ?)'); const like = `%${f.q.trim()}%`; args.push(like, like, like); }
  return db.prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY r.booking_date DESC, r.start_min DESC LIMIT 500`).all(...args);
}
