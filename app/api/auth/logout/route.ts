import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { endSession } from '@/lib/session';
export const POST = handle('public', () => { endSession(); return { ok: true }; });
