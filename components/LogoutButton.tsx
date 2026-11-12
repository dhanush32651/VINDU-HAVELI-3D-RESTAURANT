'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/client';
export default function LogoutButton({ className = 'btn-ghost !py-2' }: { className?: string }) {
  const router = useRouter();
  return <button className={className} onClick={async () => { await api('/api/auth/logout', { method: 'POST', body: {} }).catch(() => {}); router.push('/'); router.refresh(); }}><LogOut size={16} />Log out</button>;
}
