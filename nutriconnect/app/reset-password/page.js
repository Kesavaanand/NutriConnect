'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { Alert } from '@/components/ui';
import { api } from '@/lib/client';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: { email, token, password: form.password } });
      router.push(`/login?reset=1&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!email || !token) {
    return <Alert>This reset link is incomplete. Please <Link href="/forgot-password" className="font-semibold underline">request a new one</Link>.</Alert>;
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-slate-600">Setting a new password for <b className="break-all">{email}</b></p>
      {error && <Alert>{error}{error.includes('expired') && <> <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link></>}</Alert>}
      <div><label className="label">New password</label><input className="input" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" /></div>
      <div><label className="label">Confirm new password</label><input className="input" type="password" required autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
      <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Choose a new password" subtitle="Pick something you haven't used before.">
      <Suspense><ResetForm /></Suspense>
    </AuthLayout>
  );
}
