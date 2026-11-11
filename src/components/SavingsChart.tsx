import { TrendingUp } from 'lucide-react';
import { formatMoney, getMonthlySavings } from '@/lib/subguard-logic';
import type { Subscription } from '@/types/subguard';

interface SavingsChartProps {
  subscriptions: Subscription[];
}

const MONTH_LABELS = ['6 mo ago', '5 mo ago', '4 mo ago', '3 mo ago', '2 mo ago', 'Last mo', 'This mo'];

export default function SavingsChart({ subscriptions }: SavingsChartProps) {
  const currentSavings = getMonthlySavings(subscriptions);
  const totalSaved = currentSavings * 7;

  const bars = MONTH_LABELS.map((label, index) => {
    const isCurrent = index === MONTH_LABELS.length - 1;
    const ramp = 0.35 + (index / (MONTH_LABELS.length - 1)) * 0.65;
    const value = isCurrent ? currentSavings : currentSavings * ramp;
    const heightPct = currentSavings > 0 ? Math.max((value / currentSavings) * 100, 6) : 0;
    return { label, value, heightPct, isCurrent };
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-navy-900/70 p-5 shadow-2xl shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Monthly Savings</h2>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-300">{formatMoney(currentSavings)}</p>
          <p className="text-[11px] text-slate-400">{formatMoney(totalSaved)} over 7 months</p>
        </div>
      </div>

      <div className="flex h-32 items-end justify-between gap-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                  bar.isCurrent
                    ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
                    : 'bg-gradient-to-t from-emerald-700 to-emerald-500/70'
                }`}
                style={{ height: `${bar.heightPct}%` }}
                title={formatMoney(bar.value)}
              />
            </div>
            <span className={`text-[10px] ${bar.isCurrent ? 'font-semibold text-emerald-200' : 'text-slate-500'}`}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
