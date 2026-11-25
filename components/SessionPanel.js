'use client';
import { useEffect, useState } from 'react';
import { Timer, PlayCircle, CheckCircle2, Hourglass, LogOut, MessageCircleQuestion } from 'lucide-react';
import { api } from '@/lib/client';
import { Alert } from './ui';

const pad = (n) => String(n).padStart(2, '0');
export const formatLeft = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

/** Shows the live session state with a countdown and a Start button. Calls onChange when state changes. */
export default function SessionPanel({ booking, serverNow, role, onChange }) {
  const s = booking.session || {};
  const [offset] = useState(() => (serverNow ? serverNow - Date.now() : 0));
  const [now, setNow] = useState(Date.now() + offset);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const end = s.activeEnd ? new Date(s.activeEnd).getTime() : 0;
  const active = booking.status === 'accepted' && end > now;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);

  // When the countdown ends, refresh so the chat locks and the booking may complete
  useEffect(() => {
    if (end && end <= now && end > now - 1500) onChange?.();
  }, [now, end, onChange]);

  async function start() {
    const mins = s.minutes || 60;
    if (!confirm(`Start a ${mins}-minute live session now? The timer cannot be paused.`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/bookings/${booking._id}/session`, { method: 'POST' });
      onChange?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const remaining = (s.total || 1) - (s.used || 0);
  const other = role === 'client' ? 'your expert' : 'your client';
  const otherRole = role === 'client' ? 'provider' : 'client';
  const otherName = (role === 'client' ? booking.provider?.name : booking.client?.name) || (role === 'client' ? 'The dietician' : 'The client');
  const pending = s.endRequest?.by || null; // who asked to end the chat
  const blockedUntil = s.endBlockedUntil?.[role] ? new Date(s.endBlockedUntil[role]).getTime() : 0;
  const blockedFor = active && blockedUntil > now ? blockedUntil - now : 0;

  async function endChat(action, extra = {}) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/bookings/${booking._id}/session/end`, { method: 'POST', body: { action, ...extra } });
      onChange?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  let body;
  if (['pending_payment'].includes(booking.status)) {
    body = <p className="text-sm text-slate-600">Complete the payment first. The live chat session opens after payment and the expert&apos;s confirmation.</p>;
  } else if (booking.status === 'requested') {
    body = <p className="text-sm text-slate-600">{role === 'client' ? 'Waiting for the expert to accept your request.' : 'Accept this request to enable live sessions.'}</p>;
  } else if (active) {
    const pct = Math.max(0, Math.min(100, ((end - now) / (s.minutes * 60000)) * 100));
    body = (
      <div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Session live now</p>
            <p className="font-display text-4xl font-semibold tabular-nums">{formatLeft(end - now)}</p>
            <p className="text-xs text-slate-500">time remaining · chat with {other} below</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Session {s.used} of {s.total}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>

        {/* End chat: both sides can ask; the other side must agree */}
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {pending === role ? (
            <>
              <p className="flex items-center gap-2 text-sm text-slate-600"><Hourglass className="h-4 w-4 animate-pulse text-amber-500" />Waiting for {otherName} to accept ending the chat…</p>
              <button onClick={() => endChat('cancel')} disabled={busy} className="btn-ghost btn-sm">Withdraw request</button>
            </>
          ) : blockedFor ? (
            <>
              <p className="text-sm text-slate-600">{otherName} said <b>Not OK</b>. You can ask to end the chat again in <b className="tabular-nums">{formatLeft(blockedFor)}</b>.</p>
              <button disabled className="btn-secondary btn-sm"><LogOut className="h-3.5 w-3.5" />End chat</button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500">Finished early? Ask to end the chat — {other} must agree.</p>
              <button onClick={() => endChat('request')} disabled={busy || pending === otherRole} className="btn-secondary btn-sm text-red-600 hover:border-red-300 hover:bg-red-50"><LogOut className="h-3.5 w-3.5" />End chat</button>
            </>
          )}
        </div>
      </div>
    );
  } else if (booking.status === 'accepted' && remaining > 0) {
    body = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{s.used ? 'Ready for your next session' : 'Ready to start'}</p>
          <p className="text-sm text-slate-600">{remaining} session{remaining > 1 ? 's' : ''} of {s.minutes} minutes left. Chat opens only while a session is running.</p>
        </div>
        <button onClick={start} disabled={busy} className="btn-primary"><PlayCircle className="h-4 w-4" />{busy ? 'Starting…' : `Start ${s.minutes}-min session`}</button>
      </div>
    );
  } else if (booking.status === 'completed') {
    body = <p className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-brand-600" />{s.endedEarlyBy ? 'Chat ended early by mutual agreement.' : `All ${s.total} session${s.total > 1 ? 's' : ''} completed.`}</p>;
  } else {
    body = <p className="text-sm text-slate-500">This booking is {booking.status}. No sessions available.</p>;
  }

  const askPopup = active && pending === otherRole && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl" role="alertdialog" aria-labelledby="end-chat-title">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><MessageCircleQuestion className="h-7 w-7" /></span>
        <h2 id="end-chat-title" className="font-display mt-4 text-xl font-semibold">{otherName} wants to end the chat</h2>
        <p className="mt-2 text-sm text-slate-600">
          Do you also want to end it now? If you choose <b>Not OK</b>, the chat continues and {role === 'client' ? 'the dietician' : 'the client'} can&apos;t ask again for {role === 'client' ? '2 minutes' : '1 minute'}.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => endChat('respond', { accept: false })} disabled={busy} className="btn-secondary py-3">Not OK</button>
          <button onClick={() => endChat('respond', { accept: true })} disabled={busy} className="btn-primary py-3">OK, end chat</button>
        </div>
        {error && <div className="mt-3"><Alert>{error}</Alert></div>}
      </div>
    </div>
  );

  return (
    <div className={`card p-5 ${active ? 'border-emerald-300 ring-4 ring-emerald-50' : ''}`}>
      {askPopup}
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
        {active ? <Timer className="h-4 w-4 text-emerald-600" /> : <Hourglass className="h-4 w-4" />} Live session · {s.minutes || 60} minutes
      </div>
      {body}
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
    </div>
  );
}
