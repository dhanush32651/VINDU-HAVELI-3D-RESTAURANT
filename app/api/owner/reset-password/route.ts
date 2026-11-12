import { handle } from '@/lib/api';
import { ownerResetPassword } from '@/lib/services/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Owner sets a temporary password for a customer who forgot theirs (no email/SMS involved).
export const POST = handle('owner', ({ db, body }) => { const u = ownerResetPassword(db, body.identifier, body.password); return { ok: true, name: u.name }; });
