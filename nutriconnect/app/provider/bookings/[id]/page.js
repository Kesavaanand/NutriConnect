'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Save, Lock, ClipboardList } from 'lucide-react';
import { api, useLoad, fmtDate } from '@/lib/client';
import { Spinner, Alert, Stars, StatusBadge } from '@/components/ui';
import FlowSteps from '@/components/FlowSteps';
import BookingSummary from '@/components/BookingSummary';
import ChatBox from '@/components/ChatBox';
import SessionPanel from '@/components/SessionPanel';
import ProgressChart from '@/components/ProgressChart';

const DEFAULT_MEALS = [
  { time: '7:30 AM', name: 'Breakfast', items: '' },
  { time: '11:00 AM', name: 'Mid-morning snack', items: '' },
  { time: '1:30 PM', name: 'Lunch', items: '' },
  { time: '5:00 PM', name: 'Evening snack', items: '' },
  { time: '8:00 PM', name: 'Dinner', items: '' },
];

export default function ProviderBookingPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(`/api/bookings/${id}`);
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const b = data?.booking;

  useEffect(() => {
    if (!b || plan) return; // fill the form once so reloads don't wipe what is being typed
    setPlan({
      title: b.dietPlan?.title || `${b.packageSnapshot?.title} — plan for ${b.client?.name?.split(' ')[0]}`,
      overview: b.dietPlan?.overview || '',
      dailyCalories: b.dietPlan?.dailyCalories || '',
      meals: b.dietPlan?.meals?.length ? b.dietPlan.meals : DEFAULT_MEALS,
      include: b.dietPlan?.include || '',
      avoid: b.dietPlan?.avoid || '',
      guidelines: b.dietPlan?.guidelines || '',
    });
    if (['accepted', 'completed'].includes(b.status)) {
      api(`/api/progress?clientId=${b.client._id}`).then((d) => setProgress(d.entries)).catch(() => {});
    }
  }, [b]);

  // Keep this page live: notice when the other person accepts, starts or ends the session
  useEffect(() => {
    if (!['requested', 'accepted'].includes(b?.status)) return;
    const t = setInterval(reload, 4000);
    return () => clearInterval(t);
  }, [b?.status, reload]);

  const setMeal = (i, k, v) => setPlan({ ...plan, meals: plan.meals.map((m, j) => (i === j ? { ...m, [k]: v } : m)) });

  async function savePlan(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api(`/api/bookings/${id}/plan`, { method: 'PUT', body: plan });
      setMsg({ kind: 'success', text: 'Prescription saved and shared with your client.' });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function act(action) {
    try {
      await api(`/api/bookings/${id}/action`, { method: 'PATCH', body: { action } });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    }
  }

  if (loading || (b && !plan)) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  const chatActive = b.status === 'accepted' && !!b.session?.activeEnd && new Date(b.session.activeEnd).getTime() > Date.now();
  const chatDone = (b.session?.used || 0) > 0 && !chatActive;
  // Prescription form unlocks only after a live chat session has finished
  const canPlan = ['accepted', 'completed'].includes(b.status) && chatDone;
  const hasPlan = !!b.dietPlan?.updatedAt;

  return (
    <div className="space-y-6">
      <Link href="/provider" className="text-sm font-medium text-slate-500 hover:text-ink">← Appointments</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Client: {b.client?.name}</p>
          <h1 className="font-display text-2xl font-semibold">{b.packageSnapshot?.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {b.status === 'requested' && <><Link href="/provider" className="btn-ghost btn-sm">Decline from list</Link><button className="btn-primary btn-sm" onClick={() => act('accept')}>Accept appointment</button></>}
          <StatusBadge status={b.status} />
        </div>
      </div>
      <FlowSteps steps={[['Live chat', chatDone], ['Prescription', hasPlan], ['Client feedback', !!b.feedback?.rating]]} />
      <Alert kind={msg?.kind}>{msg?.text}</Alert>

      {/* Step 1: live chat first */}
      <section className="space-y-4">
        <SessionPanel booking={b} serverNow={data.serverNow} role="provider" onChange={reload} />
        <ChatBox endpoint={`/api/bookings/${id}/messages`} me={b.provider?._id} enabled={chatActive} height="h-[28rem]"
          title={`Live chat with ${b.client?.name || 'your client'}`}
          disabledText={b.status === 'accepted' ? 'Start a live session to chat with your client.' : 'Chat is open only during live sessions.'}
          note="Keep it respectful: rude messages are reported to the admin instantly. Phone numbers cannot be shared." />
      </section>

      {/* Step 2: prescription after the chat */}
      {canPlan ? (
        <form onSubmit={savePlan} className="card space-y-5 p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><ClipboardList className="h-5 w-5" /></span>
            <div>
              <h2 className="font-display text-xl font-semibold">Diet prescription</h2>
              <p className="text-sm text-slate-500">Based on your chat, tell the client what to eat more of and what to cut down. They see it as soon as you save.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} /></div>
            <div><label className="label">Daily calories (kcal)</label><input type="number" className="input" value={plan.dailyCalories} onChange={(e) => setPlan({ ...plan, dailyCalories: e.target.value })} /></div>
          </div>
          <div><label className="label">Assessment & goal</label><textarea className="input min-h-[80px]" value={plan.overview} onChange={(e) => setPlan({ ...plan, overview: e.target.value })} placeholder="What you found in the chat and the goal for this phase" /></div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <label className="label text-emerald-800">✅ Intake more (add / increase)</label>
              <textarea className="input min-h-[130px] bg-white" value={plan.include} onChange={(e) => setPlan({ ...plan, include: e.target.value })}
                placeholder={'One per line, e.g.\nGreen leafy vegetables – 2 cups a day\nWater – 2.5 litres\nProtein at every meal (dal, paneer, eggs)'} />
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
              <label className="label text-red-800">⛔ Reduce or avoid</label>
              <textarea className="input min-h-[130px] bg-white" value={plan.avoid} onChange={(e) => setPlan({ ...plan, avoid: e.target.value })}
                placeholder={'One per line, e.g.\nSugar & sweets\nFried snacks – max once a week\nSoft drinks'} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="label">Meal plan</label>
            {plan.meals.map((m, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[110px_160px_1fr_auto]">
                <input className="input" value={m.time} onChange={(e) => setMeal(i, 'time', e.target.value)} placeholder="Time" />
                <input className="input" value={m.name} onChange={(e) => setMeal(i, 'name', e.target.value)} placeholder="Meal" />
                <textarea rows={1} className="input" value={m.items} onChange={(e) => setMeal(i, 'items', e.target.value)} placeholder="Foods & portions" />
                <button type="button" className="btn-ghost px-2" onClick={() => setPlan({ ...plan, meals: plan.meals.filter((_, j) => j !== i) })} aria-label="Remove meal"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" className="btn-secondary btn-sm" onClick={() => setPlan({ ...plan, meals: [...plan.meals, { time: '', name: '', items: '' }] })}><Plus className="h-3.5 w-3.5" /> Add meal</button>
          </div>
          <div><label className="label">Other guidelines</label><textarea className="input min-h-[80px]" value={plan.guidelines} onChange={(e) => setPlan({ ...plan, guidelines: e.target.value })} placeholder="Exercise, sleep, follow-up advice…" /></div>
          <button className="btn-primary" disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving…' : hasPlan ? 'Update prescription' : 'Save & share prescription'}</button>
        </form>
      ) : ['accepted', 'completed'].includes(b.status) && (
        <div className="card flex items-center gap-3 p-6 text-sm text-slate-600">
          <Lock className="h-5 w-5 shrink-0 text-slate-400" />
          {chatActive
            ? 'Chat in progress. The diet prescription form unlocks as soon as this session ends.'
            : 'Start the live chat first. The diet prescription form unlocks after the chat session ends.'}
        </div>
      )}

      {/* Then: client progress & feedback */}
      <div className="grid gap-6 lg:grid-cols-2">
        {['accepted', 'completed'].includes(b.status) && (
          <div className="card p-6">
            <h3 className="font-semibold">Client progress (weight)</h3>
            <div className="mt-3"><ProgressChart entries={progress} metric="weight" /></div>
            {progress.length > 0 && <p className="mt-2 text-xs text-slate-500">Latest: {progress[progress.length - 1].weight} kg on {fmtDate(progress[progress.length - 1].date)}{progress[progress.length - 1].bmi ? ` · BMI ${progress[progress.length - 1].bmi}` : ''}</p>}
          </div>
        )}
        {b.feedback?.rating && (
          <div className="card p-6">
            <h3 className="font-semibold">Client feedback</h3>
            <div className="mt-3 flex justify-between text-sm"><span>Overall</span><Stars value={b.feedback.rating} /></div>
            <div className="mt-2 flex justify-between text-sm"><span>Politeness</span><Stars value={b.feedback.politeness} /></div>
            {b.feedback.comment && <p className="mt-3 text-sm text-slate-600">“{b.feedback.comment}”</p>}
          </div>
        )}
      </div>

      {/* Booking details at the bottom */}
      <BookingSummary booking={b} counterpart={`Client: ${b.client?.name}`} />
    </div>
  );
}
