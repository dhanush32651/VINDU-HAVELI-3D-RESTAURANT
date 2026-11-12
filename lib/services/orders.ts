import { Db, tx } from '../db';
import { ALL_DISHES } from '@/data/dishes';
import { totals } from '@/store/cartStore';
import { ApiError, bad, int, optStr, phone as vPhone, str } from '../validate';
import { makeCode } from './bookings';
import { PublicUser } from './auth';

export const ORDER_FLOW = ['new', 'accepted', 'preparing', 'ready', 'completed'] as const;
export type OrderStatus = (typeof ORDER_FLOW)[number] | 'cancelled';
const VISIBLE = `('paid','demo','cod','refund_pending','refunded')`; // owner never sees unpaid online orders

export function createOrder(db: Db, user: PublicUser, input: Record<string, any>, now = Date.now()) {
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 60) throw bad('Your cart is empty.');
  const items = input.items.map((i: any) => {
    const dish = ALL_DISHES.find((d) => d.id === i?.id); if (!dish) throw bad('One of the dishes is no longer on the menu.');
    return { dish, qty: int(i.qty, 'Quantity', 1, 50) };
  });
  const method = ['upi', 'card', 'cod'].includes(input.method) ? (input.method as 'upi' | 'card' | 'cod') : null; if (!method) throw bad('Choose a payment method.');
  const name = str(input.name, 'Name', 80, 2); const phone = vPhone(input.phone); const instructions = optStr(input.instructions, 'Instructions', 400);
  let reservation: any = null;
  if (input.reservationCode) {
    reservation = db.prepare("SELECT * FROM reservations WHERE code = ? AND user_id = ? AND status IN ('pending','confirmed','seated')").get(String(input.reservationCode), user.id);
    if (!reservation) throw bad('That table booking is not active, so the order cannot be linked to it.');
  }
  const address = reservation ? '' : str(input.address, 'Delivery address', 300, 5);
  const t = totals(items, typeof input.coupon === 'string' ? input.coupon.toUpperCase() : null);
  const delivery = reservation ? 0 : t.delivery; const total = t.total - t.delivery + delivery;
  const coupon = t.discount > 0 ? String(input.coupon).toUpperCase() : null;
  return tx(db, () => {
    const iso = new Date(now).toISOString();
    const r = db.prepare(`INSERT INTO orders (code, user_id, reservation_id, order_type, customer_name, customer_phone, address, instructions, coupon, subtotal, discount, tax, delivery_fee, total, payment_method, payment_status, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'new', ?, ?)`).run(makeCode('VH-OD'), user.id, reservation?.id ?? null, reservation ? 'dine_in' : 'delivery', name, phone, address, instructions, coupon, t.subtotal, t.discount, t.tax, delivery, total, method, method === 'cod' ? 'cod' : 'pending', iso, iso);
    const id = Number(r.lastInsertRowid);
    const ins = db.prepare('INSERT INTO order_items (order_id, dish_id, name, veg, qty, unit_price) VALUES (?,?,?,?,?,?)');
    for (const i of items) ins.run(id, i.dish.id, i.dish.name, i.dish.veg ? 1 : 0, i.qty, i.dish.price);
    return getOrderById(db, id)!;
  });
}

const SELECT = `SELECT o.*, rs.code AS reservation_code, t.label AS table_label FROM orders o LEFT JOIN reservations rs ON rs.id = o.reservation_id LEFT JOIN dining_tables t ON t.id = rs.table_id`;
const withItems = (db: Db, o: any) => (o ? { ...o, items: db.prepare('SELECT dish_id, name, veg, qty, unit_price FROM order_items WHERE order_id = ? ORDER BY id').all(o.id) } : o);
export const getOrderById = (db: Db, id: number) => withItems(db, db.prepare(`${SELECT} WHERE o.id = ?`).get(id));
export const getOrderByCode = (db: Db, code: string) => withItems(db, db.prepare(`${SELECT} WHERE o.code = ?`).get(code));
export const listUserOrders = (db: Db, userId: number) => db.prepare(`${SELECT} WHERE o.user_id = ? ORDER BY o.id DESC LIMIT 100`).all(userId).map((o: any) => withItems(db, o));

export function markOrderPaid(db: Db, id: number, demo: boolean, now = Date.now()) {
  db.prepare("UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ? AND payment_status = 'pending'").run(demo ? 'demo' : 'paid', new Date(now).toISOString(), id);
  return getOrderById(db, id);
}

export function ownerListOrders(db: Db, f: { status?: string; active?: boolean }) {
  const where = [`o.payment_status IN ${VISIBLE}`]; const args: any[] = [];
  if (f.active) where.push("o.status IN ('new','accepted','preparing')");
  else if (f.status && f.status !== 'all') { where.push('o.status = ?'); args.push(f.status); }
  return db.prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY o.id DESC LIMIT 300`).all(...args).map((o: any) => withItems(db, o));
}

export function ownerSetOrderStatus(db: Db, id: number, status: string, reason = '', now = Date.now()) {
  const o = db.prepare(`SELECT * FROM orders WHERE id = ? AND payment_status IN ${VISIBLE}`).get(id); if (!o) throw new ApiError(404, 'Order not found.');
  if (o.status === 'completed' || o.status === 'cancelled') throw bad(`This order is already ${o.status}.`);
  if (status === 'cancelled') { if (!reason.trim()) throw bad('Please give a reason for cancelling.'); }
  else { const i = ORDER_FLOW.indexOf(o.status); if (ORDER_FLOW[i + 1] !== status) throw bad(`Next step after "${o.status}" is "${ORDER_FLOW[i + 1]}".`); }
  const pay = status === 'cancelled' && o.payment_status === 'paid' ? 'refund_pending' : o.payment_status;
  db.prepare('UPDATE orders SET status = ?, cancel_reason = ?, payment_status = ?, updated_at = ? WHERE id = ?').run(status, status === 'cancelled' ? reason.trim().slice(0, 300) : '', pay, new Date(now).toISOString(), id);
  return getOrderById(db, id);
}
export function ownerOrderRefunded(db: Db, id: number, now = Date.now()) {
  const r = db.prepare("UPDATE orders SET payment_status = 'refunded', updated_at = ? WHERE id = ? AND payment_status = 'refund_pending'").run(new Date(now).toISOString(), id);
  if (!r.changes) throw bad('No refund is pending for this order.');
  return getOrderById(db, id);
}
