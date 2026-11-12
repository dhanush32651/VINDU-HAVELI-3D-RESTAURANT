import { handle, ipOf } from '@/lib/api';
import { ApiError } from '@/lib/validate';
import { signup } from '@/lib/services/auth';
import { startSession, homeFor } from '@/lib/session';
import { limited } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = handle('public', ({ req, db, body }) => {
  if (limited('signup:' + ipOf(req), 10, 3600_000)) throw new ApiError(429, 'Too many sign-up attempts. Please try again later.');
  const { user } = signup(db, body);
  startSession(user.id);
  return { user, redirect: homeFor(user.role) };
});
