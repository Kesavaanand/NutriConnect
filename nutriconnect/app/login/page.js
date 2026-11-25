'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleButton from '@/components/GoogleButton';
import { Alert } from '@/components/ui';
import { api, setToken, getToken } from '@/lib/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: params.get('email') || '', password: '' });
  const [unverified, setUnverified] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) return;
    api('/api/auth/me').then((d) => d.user && router.replace(`/${d.user.role}`)).catch(() => {});
  }, [router]);
  const [loading, setLoading] = useState(false);

  function goNext(user) {
    let dest = params.get('next') || `/${user.role}`;
    if (!dest.startsWith(`/${user.role}`) && !['/dieticians', '/bmi'].some((p) => dest.startsWith(p))) dest = `/${user.role}`;
    if (user.role === 'provider' && user.status !== 'approved') dest = '/provider/application';
    router.push(dest);
    router.refresh();
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await api('/api/auth/login', { method: 'POST', body: form });
      setToken(token); // this tab only
      goNext(user);
    } catch (err) {
      setError(err.message);
      setUnverified(err.data?.code === 'EMAIL_NOT_VERIFIED' ? err.data.email : '');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {params.get('verified') && !error && <Alert kind="success">✅ Email verified! You can log in now.</Alert>}
      {params.get('reset') && !error && <Alert kind="success">✅ Password changed. Log in with your new password.</Alert>}
      {error && <Alert>{error}{unverified && <> <Link href={`/verify-email?email=${encodeURIComponent(unverified)}&resend=1`} className="font-semibold underline">Verify now</Link></>}</Alert>}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
          <Link href="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">Forgot password?</Link>
        </div>
        <div className="relative">
          <input id="password" className="input pr-11" type={show ? 'text' : 'password'} autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink" aria-label="Show password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <button className="btn-primary w-full py-3" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
      <GoogleButton mode="login" onSuccess={(d) => { setToken(d.token); goNext(d.user); }} onError={setError} />
      <p className="text-center text-sm text-slate-500">
        New to NutriConnect? <Link href="/signup" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see your plans, bookings and progress.">
      <Suspense><LoginForm /></Suspense>
    </AuthLayout>
  );
}
