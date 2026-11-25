import { Check } from 'lucide-react';

/** Small progress strip: Live chat → Prescription → Feedback. steps = [[label, done], ...] */
export default function FlowSteps({ steps }) {
  const current = steps.findIndex(([, done]) => !done);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {steps.map(([label, done], i) => (
        <li key={label} className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${done ? 'bg-brand-600 text-white' : i === current ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300' : 'bg-slate-100 text-slate-400'}`}>
            {done ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
            {label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-5 bg-slate-300" />}
        </li>
      ))}
    </ol>
  );
}
