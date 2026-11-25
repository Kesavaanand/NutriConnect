'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser, roleOf } from '@/lib/client';
import { Spinner } from './ui';

/** Shows children only to the given roles (in this tab). Renders nothing while loading. */
export function ForRoles({ roles, children, fallback = null }) {
  const pathname = usePathname();
  const user = useCurrentUser([pathname]);
  if (user === undefined) return null;
  return roles.includes(roleOf(user)) ? children : fallback;
}

/** Page guard: sends people who shouldn't see this page to their own dashboard. */
export function AudienceGuard({ roles, children }) {
  const router = useRouter();
  const user = useCurrentUser();
  const allowed = user !== undefined && roles.includes(roleOf(user));
  useEffect(() => {
    if (user !== undefined && !allowed) router.replace(`/${user.role}`);
  }, [user, allowed, router]);
  if (!allowed) return <Spinner className="py-32" />;
  return children;
}

/** "Go to my dashboard" button for whoever is logged in in this tab. */
export function DashboardButton({ className = 'btn-primary px-6 py-3 text-base' }) {
  const user = useCurrentUser();
  if (!user) return null;
  const label = { client: 'My dashboard', provider: 'Go to my appointments', admin: 'Open admin panel' }[user.role];
  return <a href={`/${user.role}`} className={className}>{label}</a>;
}
