import { requireRole } from '@/lib/session';
export const dynamic = 'force-dynamic';
// Every page under /owner is protected here on the server: no owner session, no page.
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  requireRole('owner', '/owner/dashboard');
  return <>{children}</>;
}
