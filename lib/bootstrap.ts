// Optional: create the first restaurant owner from OWNER_EMAIL / OWNER_PASSWORD (+ OWNER_NAME, OWNER_PHONE) in .env.local.
import { Db } from './db';
import { hashPassword } from './password';
export function bootstrapOwner(db: Db) {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase(); const pw = process.env.OWNER_PASSWORD;
  if (!email || !pw || pw.length < 8) return;
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return;
  const phone = (process.env.OWNER_PHONE || '9000000000').replace(/\D/g, '').slice(-10);
  db.prepare("INSERT OR IGNORE INTO users (name, email, phone, password_hash, role, verified, created_at) VALUES (?,?,?,?, 'owner', 1, ?)")
    .run(process.env.OWNER_NAME || 'Restaurant Owner', email, phone, hashPassword(pw), new Date().toISOString());
}
