import { handle, ipOf } from '@/lib/api';
import { ApiError } from '@/lib/validate';
import { login } from '@/lib/services/auth';
import { startSession, homeFor } from '@/lib/session';
import { limited } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = handle('public', ({ req, db, body }) => {
  const id = String(body.identifier ?? '').toLowerCase();
  if (limited(`login:${ipOf(req)}:${id}`, 10, 15 * 60_000)) throw new ApiError(429, 'Too many attempts. Please wait a few minutes and try again.');
  const { user } = login(db, id, body.password);
  startSession(user.id);
  return { user, redirect: homeFor(user.role) };
});
