import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getSettings, updateSettings } from '@/lib/settings';
import { bad } from '@/lib/validate';

export const GET = handle('owner', ({ db }) => ({ settings: getSettings(db) }));
export const PATCH = handle('owner', ({ db, body }) => {
  try { return { settings: updateSettings(db, body) }; } catch (e: any) { throw bad(e.message); }
});
