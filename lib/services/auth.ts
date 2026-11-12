import crypto from 'node:crypto';
import { Db } from '../db';
import { hashPassword, verifyPassword, passwordProblem, safeEqual } from '../password';
import { ApiError, bad, email as vEmail, phone as vPhone, str } from '../validate';

export type Role = 'customer' | 'owner';
export interface PublicUser { id: number; name: string; email: string; phone: string; role: Role }

const SESSION_MS = 7 * 24 * 3600 * 1000;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const pub = (u: any): PublicUser => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

export function signup(db: Db, input: Record<string, any>, now = Date.now()): { user: PublicUser } {
  const name = str(input.name, 'Full name', 80, 2);
  const email = vEmail(input.email); const phone = vPhone(input.phone);
  const pw = String(input.password ?? ''); const problem = passwordProblem(pw); if (problem) throw bad(problem);
  const role: Role = input.accountType === 'owner' ? 'owner' : 'customer';
  if (role === 'owner') {
    const invite = process.env.OWNER_INVITE_CODE;
    if (!invite) throw new ApiError(403, 'Owner registration is disabled. Ask the site administrator for an invitation.');
    if (typeof input.inviteCode !== 'string' || !safeEqual(input.inviteCode.trim(), invite)) throw new ApiError(403, 'Invalid owner invitation code.');
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new ApiError(409, 'An account with this email already exists.');
  if (db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone)) throw new ApiError(409, 'An account with this phone number already exists.');
  const r = db.prepare('INSERT INTO users (name, email, phone, password_hash, role, verified, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(name, email, phone, hashPassword(pw), role, 1, new Date(now).toISOString());
  return { user: pub(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(r.lastInsertRowid))) };
}

export function findUser(db: Db, identifier: unknown): any | undefined {
  const id = String(identifier ?? '').trim().toLowerCase();
  if (!id) return undefined;
  if (id.includes('@')) return db.prepare('SELECT * FROM users WHERE email = ?').get(id);
  const digits = id.replace(/[\s-]/g, '').replace(/^\+?91(?=\d{10}$)/, '');
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(digits);
}

export function login(db: Db, identifier: unknown, password: unknown): { user: PublicUser } {
  const u = findUser(db, identifier);
  // Always run a hash comparison so response time does not reveal whether the account exists.
  const ok = verifyPassword(String(password ?? ''), u?.password_hash ?? 'scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64'));
  if (!u || !ok) throw new ApiError(401, 'Incorrect email/phone or password.');
  return { user: pub(u) };
}

/** Owner-assisted reset (no email/SMS needed): sets a new password for a customer and signs them out everywhere. */
export function ownerResetPassword(db: Db, identifier: unknown, newPassword: unknown): PublicUser {
  const problem = passwordProblem(String(newPassword ?? '')); if (problem) throw bad(problem);
  const u = findUser(db, identifier); if (!u) throw new ApiError(404, 'No account found with that email or phone.');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(String(newPassword)), u.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
  return pub(u);
}

export function createSession(db: Db, userId: number, now = Date.now()): { token: string; maxAgeSec: number } {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?,?,?,?)').run(sha(token), userId, now + SESSION_MS, new Date(now).toISOString());
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  return { token, maxAgeSec: SESSION_MS / 1000 };
}
export function userFromToken(db: Db, token: string | undefined, now = Date.now()): PublicUser | null {
  if (!token) return null;
  const u = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.verified = 1').get(sha(token), now);
  return u ? pub(u) : null;
}
export const destroySession = (db: Db, token: string | undefined) => { if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token)); };
