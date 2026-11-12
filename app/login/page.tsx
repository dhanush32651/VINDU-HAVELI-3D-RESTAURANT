import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getCurrentUser, homeFor } from '@/lib/session';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Log in | VINDU HAVELI' };
export default function Page() {
  const u = getCurrentUser(); if (u) redirect(homeFor(u.role));
  return <Suspense fallback={null}><AuthForm mode="login" /></Suspense>;
}
