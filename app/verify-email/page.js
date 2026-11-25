'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Alert } from '@/components/ui';
import { api } from '@/lib/client';

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [msg, setMsg] = useState(params.get('dev') ? { kind: 'warn', text: 'Email sending is not set up yet, so the code was printed in the terminal where "npm run dev" is running.' } : null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(params.get('resend') ? 0 : 60);
  const refs = useRef([]);

  useEffect(() => {
    if (params.get('resend') && email) resend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function setDigit(i, v) {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) { // pasted the whole code
      const all = clean.slice(0, 6).split('');
      setDigits([...all, ...Array(6 - all.length).fill('')]);
      refs.current[Math.min(all.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  async function verify(e) {
    e?.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/auth/verify-email', { method: 'POST', body: { email, code: digits.join('') } });
      router.push(`/login?verified=1&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
      setBusy(false);
    }
  }

  async function resend(silent) {
    try {
      const d = await api('/api/auth/resend-code', { method: 'POST', body: { email } });
      setWait(60);
      setDigits(['', '', '', '', '', '']);
      if (!silent || d.emailConfigured === false) {
        setMsg(d.emailConfigured === false
          ? { kind: 'warn', text: 'Email sending is not set up yet, so the new code was printed in the server terminal.' }
          : { kind: 'success', text: 'A new code has been sent to your email.' });
      }
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    }
  }

  if (!email) return <Alert>Missing email. Please <Link href="/signup" className="font-semibold underline">sign up</Link> again.</Alert>;
  const complete = digits.join('').length === 6;

  return (
    <form onSubmit={verify} className="space-y-6">
      <div className="flex gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
        <MailCheck className="h-5 w-5 shrink-0 text-brand-600" />
        <p>We sent a <b>6-digit code</b> to <b className="break-all">{email}</b>. Check your inbox (and the spam folder). The code expires in 10 minutes.</p>
      </div>
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input key={i} ref={(el) => (refs.current[i] = el)} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`} maxLength={6}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }}
            className="h-14 w-12 rounded-xl border-2 border-slate-200 text-center text-2xl font-bold focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:w-14" />
        ))}
      </div>
      <Alert kind={msg?.kind}>{msg?.text}</Alert>
      <button className="btn-primary w-full py-3" disabled={!complete || busy}>{busy ? 'Checking…' : 'Verify email'}</button>
      <p className="text-center text-sm text-slate-500">
        Didn&apos;t get it?{' '}
        {wait > 0 ? <span>Send a new code in {wait}s</span> : <button type="button" onClick={() => resend(false)} className="font-semibold text-brand-700 hover:underline">Send a new code</button>}
      </p>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Verify your email" subtitle="One last step to create your account.">
      <Suspense><VerifyForm /></Suspense>
    </AuthLayout>
  );
}
