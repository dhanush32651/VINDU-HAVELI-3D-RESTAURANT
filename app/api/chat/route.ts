import { handle } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { answer } from '@/lib/chatbot';
import { str } from '@/lib/validate';

// Optional server endpoint for the chatbot (enable in the widget with NEXT_PUBLIC_CHAT_API=true).
// This is the single place to plug in a real AI model later: call it here and fall back to answer() on error.
export const POST = handle('public', ({ body }) => answer(str(body.message, 'Message', 300)));
