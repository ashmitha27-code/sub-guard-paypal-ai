import { Bell, BellRing, Check } from 'lucide-react';
import { formatDueLabel, formatMoney, getUpcomingReminders } from '@/lib/subguard-logic';
import type { Reminder } from '@/types/subguard';

interface BillRemindersProps {
  reminders: Reminder[];
  onMarkPaid: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function BillReminders({ reminders, onMarkPaid, onDismiss }: BillRemindersProps) {
  const upcoming = getUpcomingReminders(reminders);

  return (
    <section className="rounded-2xl border border-white/10 bg-navy-900/70 p-5 shadow-2xl shadow-black/40">
      <div className="mb-4 flex items-center gap-2">
        {upcoming.length > 0 ? (
          <BellRing className="h-4 w-4 text-amber-400" />
        ) : (
          <Bell className="h-4 w-4 text-slate-400" />
        )}
        <h2 className="text-sm font-semibold text-white">Bill Reminders</h2>
        {upcoming.length > 0 && (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
            {upcoming.length} due soon
          </span>
        )}
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-slate-400">No upcoming bills. You're all caught up.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((reminder) => {
            const dueLabel = formatDueLabel(reminder.due_date);
            const isOverdue = dueLabel.includes('overdue');
            const isSoon = dueLabel.includes('today') || dueLabel.includes('tomorrow') || dueLabel.includes('overdue');

            return (
              <li
                key={reminder.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-navy-950/60 p-3 transition hover:border-amber-400/30"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${
                    isOverdue
                      ? 'bg-rose-500/15 ring-rose-400/30'
                      : isSoon
                        ? 'bg-amber-400/15 ring-amber-400/30'
                        : 'bg-navy-700 ring-white/10'
                  }`}
                >
                  <Bell className={`h-4 w-4 ${isOverdue ? 'text-rose-300' : isSoon ? 'text-amber-300' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{reminder.subscription_name}</p>
                  <p className={`text-xs ${isOverdue ? 'text-rose-300' : isSoon ? 'text-amber-200' : 'text-slate-400'}`}>
                    {dueLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">{formatMoney(reminder.amount)}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onMarkPaid(reminder.id)}
                      className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                    >
                      <Check className="inline h-3 w-3" /> Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismiss(reminder.id)}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
