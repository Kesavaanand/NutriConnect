'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Alert } from '@/components/ui';
import { api } from '@/lib/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setDone(await api('/api/auth/forgot-password', { method: 'POST', body: { email } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a link to set a new one.">
      {done ? (
        <div className="space-y-5">
          <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <MailCheck className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Reset link sent</p>
              <p className="mt-1">{done.message}</p>
              <p className="mt-1">The link is valid for 30 minutes.</p>
            </div>
          </div>
          {done.emailConfigured === false && <Alert kind="warn">Email sending is not set up yet, so the reset link was printed in the terminal where &quot;npm run dev&quot; is running.</Alert>}
          <Link href="/login" className="btn-secondary w-full">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Alert>{error}</Alert>
          <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          <p className="text-center text-sm text-slate-500"><Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to login</Link></p>
        </form>
      )}
    </AuthLayout>
  );
}
