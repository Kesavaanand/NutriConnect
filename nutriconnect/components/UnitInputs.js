'use client';
// Height (cm or ft + in) and weight (kg or lb) inputs with independent unit switches,
// so any combination works: cm + kg, cm + lb, ft/in + kg, ft/in + lb.

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.45359237;
const round1 = (n) => Math.round(n * 10) / 10;

export const emptyHeight = (unit = 'cm') => ({ unit, cm: '', ft: '', inch: '' });
export const emptyWeight = (unit = 'kg') => ({ unit, kg: '', lb: '' });

/** Height in cm (number) or 0 if not entered. */
export function heightToCm(h) {
  if (h.unit === 'cm') return Number(h.cm) || 0;
  const total = (Number(h.ft) || 0) * 12 + (Number(h.inch) || 0);
  return total ? total * CM_PER_IN : 0;
}

/** Weight in kg (number) or 0 if not entered. */
export function weightToKg(w) {
  return w.unit === 'kg' ? Number(w.kg) || 0 : (Number(w.lb) || 0) * KG_PER_LB;
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
      {options.map(([v, label]) => (
        <button type="button" key={v} onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 transition ${value === v ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function HeightInput({ value, onChange, required, hint }) {
  // Switching units converts what was typed, so nothing is lost
  function switchUnit(unit) {
    if (unit === value.unit) return;
    const cm = heightToCm(value);
    if (unit === 'cm') return onChange({ ...value, unit, cm: cm ? String(Math.round(cm)) : '' });
    const totalIn = cm / CM_PER_IN;
    let ft = Math.floor(totalIn / 12);
    let inch = Math.round(totalIn - ft * 12);
    if (inch === 12) { ft += 1; inch = 0; }
    onChange({ ...value, unit, ft: cm ? String(ft) : '', inch: cm ? String(inch) : '' });
  }
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700">Height</label>
        <Toggle options={[['cm', 'cm'], ['ftin', 'ft + in']]} value={value.unit} onChange={switchUnit} />
      </div>
      {value.unit === 'cm' ? (
        <div className="relative">
          <input className="input pr-12" type="number" inputMode="decimal" min="50" max="250" placeholder="e.g. 165" required={required}
            value={value.cm} onChange={(e) => onChange({ ...value, cm: e.target.value })} />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input className="input pr-10" type="number" inputMode="numeric" min="1" max="8" placeholder="5" required={required}
              value={value.ft} onChange={(e) => onChange({ ...value, ft: e.target.value })} />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">ft</span>
          </div>
          <div className="relative flex-1">
            <input className="input pr-10" type="number" inputMode="numeric" min="0" max="11" placeholder="6"
              value={value.inch} onChange={(e) => onChange({ ...value, inch: e.target.value })} />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">in</span>
          </div>
        </div>
      )}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function WeightInput({ value, onChange, required }) {
  function switchUnit(unit) {
    if (unit === value.unit) return;
    const kg = weightToKg(value);
    if (unit === 'kg') return onChange({ ...value, unit, kg: kg ? String(round1(kg)) : '' });
    onChange({ ...value, unit, lb: kg ? String(round1(kg / KG_PER_LB)) : '' });
  }
  const field = value.unit;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700">Weight</label>
        <Toggle options={[['kg', 'kg'], ['lb', 'lb']]} value={value.unit} onChange={switchUnit} />
      </div>
      <div className="relative">
        <input className="input pr-12" type="number" inputMode="decimal" step="0.1" min="1" placeholder={field === 'kg' ? 'e.g. 62' : 'e.g. 137'} required={required}
          value={value[field]} onChange={(e) => onChange({ ...value, [field]: e.target.value })} />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{field}</span>
      </div>
    </div>
  );
}

/** Formats a stored value for display in the chosen units. */
export const showWeight = (kg, unit) => (unit === 'lb' ? `${round1(kg / KG_PER_LB)} lb` : `${kg} kg`);
export function showHeight(cm, unit) {
  if (!cm) return '—';
  if (unit !== 'ftin') return `${Math.round(cm)} cm`;
  const totalIn = Math.round(cm / CM_PER_IN);
  return `${Math.floor(totalIn / 12)} ft ${totalIn % 12} in`;
}
