// Thin wrapper for route handlers: auth, CSRF origin check, JSON errors.
import { NextResponse } from 'next/server';
import { ApiError } from './validate';
import { getDb, Db } from './db';
import { getCurrentUser } from './session';
import { PublicUser, Role } from './services/auth';

type Access = 'public' | Role | 'user';
export interface Ctx { req: Request; db: Db; user: PublicUser | null; params: Record<string, string>; body: any }

export function handle(access: Access, fn: (c: Ctx) => Promise<unknown> | unknown) {
  return async (req: Request, ctx?: { params?: Record<string, string> }) => {
    try {
      const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      if (mutating) {
        const origin = req.headers.get('origin'); const host = req.headers.get('host');
        // Razorpay webhooks are server-to-server (no Origin header) and authenticate with their own signature.
        if (origin && host && new URL(origin).host !== host) throw new ApiError(403, 'Cross-site request blocked.');
      }
      const db = getDb(); const user = getCurrentUser();
      if (access !== 'public') {
        if (!user) throw new ApiError(401, 'Please log in first.');
        if ((access === 'customer' || access === 'owner') && user.role !== access) throw new ApiError(403, 'You do not have access to this.');
      }
      let body: any = undefined;
      if (mutating && req.headers.get('content-type')?.includes('application/json')) { try { body = await req.json(); } catch { throw new ApiError(400, 'Invalid JSON.'); } }
      const out = await fn({ req, db, user, params: ctx?.params ?? {}, body: body ?? {} });
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e: any) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message, ...(e.extra ?? {}) }, { status: e.status });
      console.error('[api error]', e);
      return NextResponse.json({ error: 'Something went wrong on the server. Please try again.' }, { status: 500 });
    }
  };
}

export const ipOf = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
export const FLAGS = "export const dynamic = 'force-dynamic';\nexport const runtime = 'nodejs';\n";
