import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { handleWebhook } from '@/lib/services/payments';
import { ApiError } from '@/lib/validate';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure this URL in the Razorpay dashboard (Settings > Webhooks) with events payment.captured / order.paid.
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    return NextResponse.json(handleWebhook(getDb(), raw, req.headers.get('x-razorpay-signature')));
  } catch (e: any) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[webhook]', e); return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}
