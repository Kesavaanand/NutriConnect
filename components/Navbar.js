'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import Logo from './Logo';
import { api, initials, clearToken, getToken } from '@/lib/client';
import { AUDIENCE } from '@/lib/audience';

// Each link is shown only to the roles listed in lib/audience.js
const PUBLIC_LINKS = [
  { href: '/dieticians', label: 'Find an expert', roles: AUDIENCE.findExpert },
  { href: '/bmi', label: 'BMI calculator', roles: AUDIENCE.bmi },
  { href: '/sample-document', label: 'For dieticians', roles: AUDIENCE.forDieticians },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) setUser(null);
    else api('/api/auth/me').then((d) => setUser(d.user || null)).catch(() => setUser(null));
    setOpen(false);
  }, [pathname]);

  async function logout() {
    clearToken(); // logs out only this browser tab
    setUser(null);
    router.push('/');
  }


  useEffect(() => {
    const base = document.title.replace(/^\[(Client|Dietician|Admin)\] /, '');
    const tag = { client: 'Client', provider: 'Dietician', admin: 'Admin' }[user?.role];
    document.title = tag ? `[${tag}] ${base}` : base;
  }, [user, pathname]);

  const links = user === undefined ? [] : PUBLIC_LINKS.filter((l) => l.roles.includes(user ? user.role : 'guest'));

  const dashLabel = { client: 'My dashboard', provider: 'Expert dashboard', admin: 'Admin panel' };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-[#fbfaf6]/85 backdrop-blur">
      <nav className="container-x flex h-16 items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname.startsWith(l.href) ? 'text-brand-700' : 'text-slate-600 hover:text-ink'}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user === undefined ? null : user ? (
            <>
              {user.role === 'admin' && user.openReports > 0 && (
                <Link href="/admin/reports" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Open reports">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{user.openReports}</span>
                </Link>
              )}
              <Link href={`/${user.role}`} className="btn-secondary">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{initials(user.name)}</span>
                {dashLabel[user.role]}
              </Link>
              <button onClick={logout} className="btn-ghost" title="Log out"><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50">{l.label}</Link>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            {user === undefined ? null : user ? (
              <>
                <Link href={`/${user.role}`} className="btn-primary">{dashLabel[user.role]}</Link>
                <button onClick={logout} className="btn-secondary">Log out</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-secondary">Log in</Link>
                <Link href="/signup" className="btn-primary">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
