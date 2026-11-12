-- VINDU HAVELI database schema (SQLite). Applied automatically on first start.
-- Safe to run repeatedly: every statement uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer', 'owner')),
  verified      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,            -- sha256 of the cookie token (raw token is never stored)
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,                -- epoch milliseconds
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Exactly eight tables (ids 1..8 enforced by the CHECK constraint).
CREATE TABLE IF NOT EXISTS dining_tables (
  id    INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 8),
  label TEXT NOT NULL UNIQUE,
  seats INTEGER NOT NULL CHECK (seats > 0)
);

CREATE TABLE IF NOT EXISTS reservations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL UNIQUE,       -- e.g. VH-BK-7K2M9Q
  user_id         INTEGER NOT NULL REFERENCES users(id),
  table_id        INTEGER NOT NULL REFERENCES dining_tables(id),
  booking_date    TEXT NOT NULL,              -- YYYY-MM-DD (restaurant time zone)
  start_min       INTEGER NOT NULL,           -- minutes after midnight
  end_min         INTEGER NOT NULL,
  guests          INTEGER NOT NULL CHECK (guests > 0),
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  -- held = waiting for payment (expires), pending = paid & awaiting owner, confirmed,
  -- seated = occupied now, completed, rejected, cancelled, no_show, expired
  status          TEXT NOT NULL CHECK (status IN ('held','pending','confirmed','seated','completed','rejected','cancelled','no_show','expired')),
  payment_status  TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','demo','refund_pending','refunded')),
  advance_paise   INTEGER NOT NULL,
  hold_expires_at INTEGER,
  status_reason   TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  CHECK (end_min > start_min)
);
CREATE INDEX IF NOT EXISTS idx_res_slot ON reservations (booking_date, table_id);
CREATE INDEX IF NOT EXISTS idx_res_user ON reservations (user_id);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,        -- e.g. VH-OD-4X8R2B
  user_id        INTEGER NOT NULL REFERENCES users(id),
  reservation_id INTEGER REFERENCES reservations(id),
  order_type     TEXT NOT NULL CHECK (order_type IN ('delivery','dine_in')),
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address        TEXT NOT NULL DEFAULT '',
  instructions   TEXT NOT NULL DEFAULT '',
  coupon         TEXT,
  subtotal       INTEGER NOT NULL,            -- rupees
  discount       INTEGER NOT NULL,
  tax            INTEGER NOT NULL,
  delivery_fee   INTEGER NOT NULL,
  total          INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi','card','cod')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending','paid','demo','cod','failed','refund_pending','refunded')),
  status         TEXT NOT NULL CHECK (status IN ('new','accepted','preparing','ready','completed','cancelled')),
  cancel_reason  TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  veg        INTEGER NOT NULL,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  unit_price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  purpose             TEXT NOT NULL CHECK (purpose IN ('booking','order')),
  ref_id              INTEGER NOT NULL,       -- reservations.id or orders.id
  user_id             INTEGER NOT NULL REFERENCES users(id),
  provider            TEXT NOT NULL CHECK (provider IN ('razorpay','demo')),
  provider_order_id   TEXT,
  provider_payment_id TEXT,
  amount_paise        INTEGER NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL CHECK (status IN ('created','paid','demo','failed')),
  created_at          TEXT NOT NULL,
  verified_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_pay_ref ON payments (purpose, ref_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pay_provider_order ON payments (provider_order_id) WHERE provider_order_id IS NOT NULL;
