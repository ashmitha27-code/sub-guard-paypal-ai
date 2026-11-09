import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CreditCard, Music, ShoppingBag, Tv } from 'lucide-react';
import { formatMoney } from '@/lib/subguard-logic';
import type { Subscription } from '@/types/subguard';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Streaming: Tv,
  Music,
  Shopping: ShoppingBag,
};

interface SubscriptionRowProps {
  subscription: Subscription;
}

export default function SubscriptionRow({ subscription }: SubscriptionRowProps) {
  const Icon = CATEGORY_ICONS[subscription.category] ?? CreditCard;
  const hike = subscription.previous_price === null ? 0 : subscription.price - subscription.previous_price;

  return (
    <li className="animate-fade-up flex items-center gap-3 rounded-xl border border-white/5 bg-navy-950/60 p-3 transition hover:border-emerald-400/30 hover:bg-navy-800/60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-emerald-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{subscription.name}</p>
        <p className="text-xs text-slate-400">{subscription.category}</p>
        {subscription.alert_type === 'price_hike' && hike > 0 && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Price up {formatMoney(hike)}
          </span>
        )}
        {subscription.alert_type === 'duplicate' && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Duplicate
          </span>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-white">{formatMoney(subscription.price)}</p>
        <p className="text-[11px] text-slate-400">per month</p>
      </div>
    </li>
  );
}
