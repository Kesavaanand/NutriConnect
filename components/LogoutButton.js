'use client';
import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/client';

export default function LogoutButton({ className = 'btn-primary' }) {
  const router = useRouter();
  async function logout() {
    clearToken(); // logs out only this browser tab
    router.push('/');
    router.refresh();
  }
  return <button onClick={logout} className={className}>Log out</button>;
}
