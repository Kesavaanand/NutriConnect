'use client';
import { useState } from 'react';
import { Plus, Pencil, PackageOpen, Check } from 'lucide-react';
import { api, useLoad, inr } from '@/lib/client';
import { PageHeader, Spinner, Alert, Empty, Modal } from '@/components/ui';

const EMPTY = { title: '', description: '', durationWeeks: 4, price: '', features: '' };
const MIN = 100;
const MAX = 500;
const inRange = (p) => Number(p) >= MIN && Number(p) <= MAX;

export default function PackagesPage() {
  const { data, loading, error, reload } = useLoad('/api/provider/packages');
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');

  function open(pkg) {
    setErr('');
    setEditing(pkg ? { ...pkg, features: (pkg.features || []).join('\n') } : { ...EMPTY });
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing._id) await api(`/api/provider/packages/${editing._id}`, { method: 'PUT', body: editing });
      else await api('/api/provider/packages', { method: 'POST', body: editing });
      setEditing(null);
      reload();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function toggle(pkg) {
    try {
      await api(`/api/provider/packages/${pkg._id}`, { method: 'PUT', body: { active: !pkg.active } });
      reload();
    } catch (e) {
      alert(e.message);
    }
  }

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Diet packages" subtitle={`Each booking is one 1-hour live chat session. Price per hour must be between ₹${MIN} and ₹${MAX}.`}
        action={<button className="btn-primary" onClick={() => open(null)}><Plus className="h-4 w-4" /> New package</button>} />
      <Alert>{error}</Alert>
      {loading ? <Spinner /> : !data?.packages?.length ? (
        <Empty icon={PackageOpen} title="No packages yet" text="Create your first package — e.g. a 4-week weight-loss plan with weekly check-ins." action={<button className="btn-primary" onClick={() => open(null)}>Create package</button>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.packages.map((k) => (
            <div key={k._id} className={`card flex flex-col p-5 ${k.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{k.title}</p><p className="text-xs text-slate-500">{k.durationWeeks}-week plan · 1-hour live session</p></div>
                <p className="text-right text-lg font-bold text-brand-700">{inr(k.price)}<span className="block text-xs font-medium text-slate-500">per hour</span></p>
              </div>
              {!inRange(k.price) && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">Hidden from clients: edit the price to ₹{MIN}–₹{MAX} per hour.</p>}
              {k.description && <p className="mt-2 text-sm text-slate-600">{k.description}</p>}
              <ul className="mt-3 space-y-1 text-sm">{k.features?.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-brand-600" />{f}</li>)}</ul>
              <div className="mt-auto flex items-center justify-between pt-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={k.active} onChange={() => toggle(k)} className="h-4 w-4 accent-brand-600" />
                  {k.active ? 'Visible to clients' : 'Hidden'}
                </label>
                <button className="btn-secondary btn-sm" onClick={() => open(k)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit package' : 'New package'} wide>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Alert>{err}</Alert>
            <div><label className="label">Title</label><input className="input" required value={editing.title} onChange={set('title')} placeholder="e.g. PCOS Balance — 8 weeks" /></div>
            <div><label className="label">Description</label><textarea className="input" value={editing.description} onChange={set('description')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Plan length (weeks)</label><input type="number" min="1" className="input" value={editing.durationWeeks} onChange={set('durationWeeks')} /></div>
              <div>
                <label className="label">Price per hour (₹)</label>
                <input type="number" min={MIN} max={MAX} step="1" required className="input" value={editing.price} onChange={set('price')} placeholder={`${MIN} – ${MAX}`} />
                <p className={`hint ${editing.price !== '' && !inRange(editing.price) ? 'font-semibold text-red-600' : ''}`}>Allowed: ₹{MIN} to ₹{MAX} per 1-hour session</p>
              </div>
            </div>
            <div><label className="label">What&apos;s included (one per line)</label><textarea className="input min-h-[100px]" value={editing.features} onChange={set('features')} placeholder={'Personalised meal plan\nWeekly video check-in\nChat support'} /></div>
            <button className="btn-primary w-full">Save package</button>
          </form>
        )}
      </Modal>
    </>
  );
}
