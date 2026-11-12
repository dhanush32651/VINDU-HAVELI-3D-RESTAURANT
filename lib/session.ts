// Server-only helpers that tie the cookie to the database session (use in route handlers and server components).
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db';
import { PublicUser, Role, createSession, destroySession, userFromToken } from './services/auth';

export const COOKIE = 'vh_session';

export function getCurrentUser(): PublicUser | null {
  const token = cookies().get(COOKIE)?.value;
  return userFromToken(getDb(), token);
}
export function startSession(userId: number) {
  const { token, maxAgeSec } = createSession(getDb(), userId);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', path: '/', maxAge: maxAgeSec });
}
export function endSession() {
  destroySession(getDb(), cookies().get(COOKIE)?.value);
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
export const homeFor = (role: Role) => (role === 'owner' ? '/owner/dashboard' : '/dashboard');

/** For server pages: send visitors to /login, or to their own dashboard if the role is wrong. */
export function requireRole(role: Role, nextPath: string): PublicUser {
  const u = getCurrentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (u.role !== role) redirect(homeFor(u.role));
  return u;
}
export const clientIp = () => headers().get('x-forwarded-for')?.split(',')[0].trim() || headers().get('x-real-ip') || 'local';
