import { Utensils, Flame, CirclePlus, CircleMinus } from 'lucide-react';

const lines = (t = '') => String(t).split('\n').map((s) => s.replace(/^[-•*\s]+/, '').trim()).filter(Boolean);

/** The diet prescription the expert writes after the live chat. */
export default function DietPlanView({ plan }) {
  const include = lines(plan?.include);
  const avoid = lines(plan?.avoid);
  if (!plan?.meals?.length && !plan?.overview && !include.length && !avoid.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Your diet prescription</p>
        <h3 className="font-display mt-1 text-2xl font-semibold">{plan.title}</h3>
        {plan.dailyCalories && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm"><Flame className="h-4 w-4" />{plan.dailyCalories} kcal / day</p>}
      </div>
      <div className="space-y-6 p-6">
        {plan.overview && <p className="whitespace-pre-line text-slate-700">{plan.overview}</p>}

        {(include.length > 0 || avoid.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-800"><CirclePlus className="h-5 w-5" /> Intake more</p>
              {include.length ? (
                <ul className="space-y-2 text-sm text-emerald-950">{include.map((x) => <li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{x}</li>)}</ul>
              ) : <p className="text-sm text-emerald-700">—</p>}
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold text-red-800"><CircleMinus className="h-5 w-5" /> Reduce or avoid</p>
              {avoid.length ? (
                <ul className="space-y-2 text-sm text-red-950">{avoid.map((x) => <li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />{x}</li>)}</ul>
              ) : <p className="text-sm text-red-700">—</p>}
            </div>
          </div>
        )}

        {plan.meals?.length > 0 && (
          <div>
            <p className="mb-3 font-semibold">Meal plan</p>
            <ol className="relative space-y-4 border-l-2 border-brand-100 pl-6">
              {plan.meals.map((m, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white ring-4 ring-white"><Utensils className="h-3 w-3" /></span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{m.time}</p>
                  <p className="font-semibold">{m.name}</p>
                  <p className="whitespace-pre-line text-sm text-slate-600">{m.items}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
        {plan.guidelines && (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="mb-1 font-semibold">Other guidelines</p>
            <p className="whitespace-pre-line">{plan.guidelines}</p>
          </div>
        )}
        {plan.updatedAt && <p className="text-xs text-slate-400">Last updated {new Date(plan.updatedAt).toLocaleString('en-IN')}</p>}
      </div>
    </div>
  );
}
