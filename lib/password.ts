// Password hashing with scrypt (built into Node, no extra dependency). Format: scrypt$N$salt$hash
import crypto from 'node:crypto';
const N = 16384, KEYLEN = 64;
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N });
  return `scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const [alg, n, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const got = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: Number(n) });
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}
export function passwordProblem(p: string): string | null {
  if (p.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password must contain at least one letter and one number.';
  if (p.length > 128) return 'Password is too long.';
  return null;
}
export const safeEqual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
