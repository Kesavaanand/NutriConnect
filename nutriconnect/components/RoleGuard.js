'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Ban } from 'lucide-react';
import { api, getToken, clearToken } from '@/lib/client';
import DashboardShell from './DashboardShell';
import LogoutButton from './LogoutButton';
import { Spinner } from './ui';

/**
 * Protects /client, /provider and /admin using THIS tab's login.
 * (Every API also re-checks the role on the server, so this is only for navigation.)
 */
export default function RoleGuard({ role, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let alive = true;
    const toLogin = () => router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (!getToken()) return toLogin();
    api('/api/auth/me')
      .then(({ user: u }) => {
        if (!alive) return;
        if (!u) { clearToken(); return toLogin(); }
        if (u.role !== role) return router.replace(`/${u.role}`);
        if (role === 'provider' && u.status !== 'approved' && u.status !== 'terminated') {
          const allowed = ['/provider/application', ...(u.status === 'suspended' ? ['/provider/hearing'] : [])];
          if (!allowed.some((p) => pathname.startsWith(p))) return router.replace('/provider/application');
        }
        setUser(u);
      })
      .catch(() => { clearToken(); toLogin(); });
    return () => { alive = false; };
  }, [pathname, role, router]);

  if (!user) return <Spinner className="py-32" />;

  if (role === 'provider' && user.status === 'terminated') {
    return (
      <div className="container-x flex flex-col items-center py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><Ban className="h-7 w-7" /></span>
        <h1 className="font-display mt-4 text-2xl font-semibold">Your account has been terminated</h1>
        <p className="mt-2 max-w-md text-slate-600">
          The NutriConnect admin has removed your expert account.{user.statusReason ? ` Reason: ${user.statusReason}` : ''}
        </p>
        <div className="mt-6"><LogoutButton /></div>
      </div>
    );
  }

  return <DashboardShell role={role} status={user.status}>{children}</DashboardShell>;
}
