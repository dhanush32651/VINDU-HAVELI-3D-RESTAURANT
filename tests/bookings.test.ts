import test from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, addUser, NOW } from './helpers';
import { createBooking, listSlots, tableViews, markBookingPaid, ownerSetStatus, customerCancel, expireHolds } from '@/lib/services/bookings';
import { updateSettings, getSettings } from '@/lib/settings';

const base = { date: '2026-11-13', start: 19 * 60, guests: 2, tableId: 1, name: 'Asha Rao', phone: '9876543210' };

test('exactly eight tables exist and a ninth cannot be inserted', () => {
  const db = freshDb();
  assert.equal(db.prepare('SELECT COUNT(*) c FROM dining_tables').get().c, 8);
  assert.throws(() => db.prepare("INSERT INTO dining_tables (id,label,seats) VALUES (9,'TABLE 09',2)").run());
});

test('default settings: advance Rs 200, 90 minute duration', () => {
  const s = getSettings(freshDb()); assert.equal(s.advance_amount, 200); assert.equal(s.booking_duration, 90);
});

test('creating a booking holds the table with the configured advance', () => {
  const db = freshDb(); const u = addUser(db);
  const b = createBooking(db, u, base, NOW);
  assert.equal(b.status, 'held'); assert.equal(b.payment_status, 'unpaid'); assert.equal(b.advance_paise, 20000); assert.equal(b.end_min - b.start_min, 90); assert.equal(b.table_label, 'TABLE 01');
});

test('server rejects overlapping bookings of the same table (even by another customer)', () => {
  const db = freshDb(); const a = addUser(db, 'customer', 1), b = addUser(db, 'customer', 2);
  createBooking(db, a, base, NOW);
  assert.throws(() => createBooking(db, b, { ...base, start: 19 * 60 + 30 }, NOW), /already reserved/);   // overlaps second half
  assert.throws(() => createBooking(db, b, { ...base, start: 18 * 60 + 30 }, NOW), /already reserved/);   // overlaps first half
  assert.throws(() => createBooking(db, b, { ...base, start: 19 * 60 }, NOW), /already reserved/);        // identical
});

test('table is free again after the duration ends, and other tables are unaffected', () => {
  const db = freshDb(); const a = addUser(db, 'customer', 1), b = addUser(db, 'customer', 2);
  createBooking(db, a, base, NOW);
  assert.ok(createBooking(db, b, { ...base, start: 19 * 60 + 90 }, NOW));          // starts exactly when first ends
  assert.ok(createBooking(db, b, { ...base, start: 17 * 60 + 30 }, NOW));          // ends exactly when first starts
  assert.ok(createBooking(db, b, { ...base, tableId: 2 }, NOW));                   // another table, same time
  const v = tableViews(db, base.date, 20 * 60, 21 * 60 + 30, 2, NOW);
  assert.equal(v.find((t) => t.id === 1)!.state, 'reserved');
});

test('an unpaid hold expires and frees the table', () => {
  const db = freshDb(); const a = addUser(db, 'customer', 1), b = addUser(db, 'customer', 2);
  createBooking(db, a, base, NOW);
  const later = NOW + 11 * 60_000;                                                  // hold is 10 min
  assert.ok(createBooking(db, b, base, later));
  assert.equal(db.prepare("SELECT status FROM reservations WHERE user_id = ?").get(a.id).status, 'expired');
});

test('paid bookings keep blocking; owner confirm/seat/complete; rejected frees table', () => {
  const db = freshDb(); const a = addUser(db, 'customer', 1), b = addUser(db, 'customer', 2);
  const bk = createBooking(db, a, base, NOW);
  const paid = markBookingPaid(db, bk.id, true, NOW + 20 * 60_000);                 // paid after hold window: still blocks
  assert.equal(paid.status, 'pending'); assert.equal(paid.payment_status, 'demo');
  assert.throws(() => createBooking(db, b, base, NOW + 21 * 60_000), /already reserved/);
  assert.equal(ownerSetStatus(db, bk.id, 'confirmed', '').status, 'confirmed');
  assert.equal(tableViews(db, base.date, base.start, base.start + 90, 2, NOW)[0].state, 'reserved');
  assert.equal(ownerSetStatus(db, bk.id, 'seated', '').status, 'seated');
  assert.equal(tableViews(db, base.date, base.start, base.start + 90, 2, NOW)[0].state, 'occupied');
  assert.equal(ownerSetStatus(db, bk.id, 'completed', '').status, 'completed');
  assert.ok(createBooking(db, b, base, NOW));                                       // completed booking no longer blocks
});

test('rejecting needs a reason and flags a real (non-demo) payment for refund', () => {
  const db = freshDb(); const a = addUser(db);
  const bk = createBooking(db, a, base, NOW); markBookingPaid(db, bk.id, false, NOW);
  assert.throws(() => ownerSetStatus(db, bk.id, 'rejected', ''), /reason/);
  const r = ownerSetStatus(db, bk.id, 'rejected', 'Kitchen closed'); assert.equal(r.payment_status, 'refund_pending');
});

test('late verified payment on a lapsed hold that was taken by someone else is refused and marked for refund', () => {
  const db = freshDb(); const a = addUser(db, 'customer', 1), b = addUser(db, 'customer', 2);
  const first = createBooking(db, a, base, NOW);
  const second = createBooking(db, b, base, NOW + 11 * 60_000);                      // first hold expired
  markBookingPaid(db, second.id, false, NOW + 12 * 60_000);
  assert.throws(() => markBookingPaid(db, first.id, false, NOW + 13 * 60_000), /taken/);
  assert.equal(db.prepare('SELECT payment_status FROM reservations WHERE id = ?').get(first.id).payment_status, 'refund_pending');
});

test('validation: guests vs seats, hours, past times, date window', () => {
  const db = freshDb(); const u = addUser(db);
  assert.throws(() => createBooking(db, u, { ...base, guests: 3 }, NOW), /seats 2/);                  // table 1 seats 2
  assert.ok(createBooking(db, u, { ...base, guests: 8, tableId: 8 }, NOW));
  assert.throws(() => createBooking(db, u, { ...base, start: 10 * 60 }, NOW), /booking hours/);
  assert.throws(() => createBooking(db, u, { ...base, start: 22 * 60 + 30 }, NOW), /booking hours/);    // 22:30 + 90 > 23:30
  assert.throws(() => createBooking(db, u, { ...base, start: 19 * 60 + 10 }, NOW), /booking hours/);    // not on a 30 min slot
  assert.throws(() => createBooking(db, u, { ...base, date: '2026-11-12', start: 15 * 60 }, NOW), /passed/);
  assert.throws(() => createBooking(db, u, { ...base, date: '2026-11-11' }, NOW), /future/);
  assert.throws(() => createBooking(db, u, { ...base, date: '2027-03-01' }, NOW), /ahead/);
  assert.throws(() => createBooking(db, u, { ...base, date: '2026-02-31' }, NOW), /valid date/);
  assert.throws(() => createBooking(db, u, { ...base, phone: '123' }, NOW), /mobile/);
  assert.throws(() => createBooking(db, u, { ...base, tableId: 9 }, NOW));
});

test('slot list excludes passed times today and counts free tables', () => {
  const db = freshDb(); const u = addUser(db);
  const today = listSlots(db, '2026-11-12', 2, NOW);
  assert.ok(today.filter((s) => s.start <= 15 * 60 + 30).every((s) => s.past && s.free === 0));
  assert.equal(today[today.length - 1].start, 22 * 60);                                  // last start so booking ends by 23:30
  createBooking(db, u, { ...base, start: 20 * 60 }, NOW);
  const slot = listSlots(db, '2026-11-13', 2, NOW).find((s) => s.start === 20 * 60)!;
  assert.equal(slot.free, 7);
});

test('configurable duration and advance are honoured', () => {
  const db = freshDb(); const u = addUser(db);
  updateSettings(db, { advance_amount: 350, booking_duration: 120 });
  const b = createBooking(db, u, base, NOW); assert.equal(b.advance_paise, 35000); assert.equal(b.end_min - b.start_min, 120);
  assert.throws(() => updateSettings(db, { booking_duration: 5 }), /between/);
  assert.throws(() => updateSettings(db, { advance_amount: 0 }), /between/);
});

test('auto_confirm setting confirms paid bookings automatically', () => {
  const db = freshDb(); const u = addUser(db); updateSettings(db, { auto_confirm: 1 });
  const b = createBooking(db, u, base, NOW); assert.equal(markBookingPaid(db, b.id, true, NOW).status, 'confirmed');
});

test('customer can cancel own booking only; paid advance goes to refund_pending', () => {
  const db = freshDb(); const a = addUser(db, 'customer', 1), b = addUser(db, 'customer', 2);
  const bk = createBooking(db, a, base, NOW); markBookingPaid(db, bk.id, false, NOW);
  assert.throws(() => customerCancel(db, b, bk.code, NOW), /not found/);
  const c = customerCancel(db, a, bk.code, NOW); assert.equal(c.status, 'cancelled'); assert.equal(c.payment_status, 'refund_pending');
  assert.ok(createBooking(db, b, base, NOW));
});

test('concurrency: many simultaneous attempts on one slot yield exactly one booking', async () => {
  const db = freshDb(); const users = Array.from({ length: 12 }, (_, i) => addUser(db, 'customer', i + 1));
  const results = await Promise.allSettled(users.map(async (u) => createBooking(db, u, base, NOW)));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(db.prepare("SELECT COUNT(*) c FROM reservations WHERE table_id = 1").get().c, 1);
});
