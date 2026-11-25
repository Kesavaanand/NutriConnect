'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { calcBMI, bmiCategory, healthyRange } from '@/lib/bmi';
import { api } from '@/lib/client';
import { Alert } from './ui';
import { HeightInput, WeightInput, emptyHeight, emptyWeight, heightToCm, weightToKg, showWeight } from './UnitInputs';

export default function BMICalculator() {
  const [height, setHeight] = useState(emptyHeight('cm'));
  const [weight, setWeight] = useState(emptyWeight('kg'));
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { api('/api/auth/me').then((d) => setUser(d.user)).catch(() => {}); }, []);

  const heightCm = heightToCm(height);
  const weightKg = weightToKg(weight);
  const bmi = heightCm > 50 && weightKg > 10 ? calcBMI(weightKg, heightCm) : null;
  const cat = bmiCategory(bmi);
  const range = bmi ? healthyRange(heightCm) : null;
  const pos = bmi ? Math.min(100, Math.max(0, ((bmi - 12) / (40 - 12)) * 100)) : null;

  async function save() {
    setMsg(null);
    try {
      await api('/api/progress', { method: 'POST', body: { weight: Math.round(weightKg * 10) / 10, heightCm: Math.round(heightCm) } });
      setMsg({ kind: 'success', text: 'Saved to your progress report.' });
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card p-6 lg:col-span-3">
        <p className="mb-5 text-sm text-slate-500">Pick the units you know — they can be mixed, e.g. <b>cm + lb</b> or <b>ft/in + kg</b>.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <HeightInput value={height} onChange={setHeight} />
          <WeightInput value={weight} onChange={setWeight} />
        </div>
        <p className="hint mt-4">BMI is a screening tool for adults (18+). It does not measure body fat directly — a dietician will look at the full picture.</p>
      </div>

      <div className="card flex flex-col p-6 lg:col-span-2">
        <p className="text-sm font-medium text-slate-500">Your BMI</p>
        <p className="font-display mt-1 text-6xl font-semibold" style={{ color: cat?.color || '#94a3b8' }}>{bmi ?? '—'}</p>
        {cat ? <span className={`mt-2 w-fit rounded-full px-3 py-1 text-sm font-semibold ${cat.tone}`}>{cat.label}</span>
             : <p className="mt-2 text-sm text-slate-500">Enter your height and weight to see your result.</p>}

        <div className="relative mt-6">
          <div className="flex h-3 overflow-hidden rounded-full">
            <div className="bg-blue-400" style={{ width: '23.2%' }} />
            <div className="bg-emerald-500" style={{ width: '23.2%' }} />
            <div className="bg-amber-400" style={{ width: '17.9%' }} />
            <div className="flex-1 bg-red-400" />
          </div>
          {pos !== null && <div className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-ink ring-2 ring-white" style={{ left: `${pos}%` }} />}
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400"><span>12</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
        </div>

        {cat && (
          <div className="mt-5 space-y-3 text-sm">
            {range && <p>Healthy weight for your height: <b>{showWeight(range[0], weight.unit).replace(/ (kg|lb)$/, '')} – {showWeight(range[1], weight.unit)}</b></p>}
            <p className="text-slate-600">{cat.advice}</p>
          </div>
        )}

        <div className="mt-auto space-y-2 pt-6">
          <Alert kind={msg?.kind}>{msg?.text}</Alert>
          {bmi && user?.role === 'client' && <button onClick={save} className="btn-primary w-full">Save to my progress</button>}
          {bmi && !user && <Link href="/signup" className="btn-secondary w-full">Sign up to track your progress</Link>}
          <Link href="/dieticians" className="btn-ghost w-full">Talk to a dietician →</Link>
        </div>
      </div>
    </div>
  );
}
