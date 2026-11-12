import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getCurrentUser } from '@/lib/session';
export const GET = handle('public', () => ({ user: getCurrentUser() }));
