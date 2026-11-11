import { CheckCircle2, Plus } from 'lucide-react';
import SubscriptionRow from '@/components/SubscriptionRow';
import { formatMoney, getActiveSubscriptions, getMonthlySpend } from '@/lib/subguard-logic';
import type { Subscription } from '@/types/subguard';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  onAddCustom: () => void;
}

export default function SubscriptionList({ subscriptions, isLoading, onAddCustom }: SubscriptionListProps) {
  const active = getActiveSubscriptions(subscriptions);
  const cancelled = subscriptions.filter((sub) => sub.status === 'cancelled');

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-900/70 shadow-2xl shadow-black/40">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Subscriptions</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              {active.length}
            </span>
            <button
              type="button"
              onClick={onAddCustom}
              className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/20 active:scale-95"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">Linked accounts, updated live</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p className="px-1 text-sm text-slate-400">Loading your subscriptions...</p>
        ) : active.length === 0 ? (
          <p className="px-1 text-sm text-slate-400">No active subscriptions right now.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((sub) => (
              <SubscriptionRow key={sub.id} subscription={sub} />
            ))}
          </ul>
        )}

        {cancelled.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recently cancelled</p>
            <ul className="space-y-2">
              {cancelled.map((sub) => (
                <li key={sub.id} className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-400 line-through">{sub.name}</p>
                  <p className="text-xs font-medium text-emerald-300">Saves {formatMoney(sub.price)}/mo</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-navy-950/60 px-5 py-4">
        <p className="text-xs text-slate-400">Total per month</p>
        <p className="text-base font-semibold text-white">{formatMoney(getMonthlySpend(subscriptions))}</p>
      </div>
    </aside>
  );
}
