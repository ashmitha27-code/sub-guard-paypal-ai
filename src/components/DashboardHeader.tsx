import type { LucideIcon } from 'lucide-react';
import { PiggyBank, ShieldCheck, Wallet } from 'lucide-react';
import { formatMoney } from '@/lib/subguard-logic';

interface DashboardHeaderProps {
  monthlySpend: number;
  monthlySavings: number;
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}

function Stat({ icon: Icon, label, value, accent = false }: StatProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-900/80 px-4 py-2">
      <Icon className={`h-4 w-4 ${accent ? 'text-emerald-400' : 'text-slate-400'}`} />
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-sm font-semibold ${accent ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function DashboardHeader({ monthlySpend, monthlySavings }: DashboardHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-navy-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 ring-1 ring-emerald-400/40">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-white">Subguard AI</p>
            <p className="text-xs text-slate-400">Subscription guardian</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Stat icon={Wallet} label="Monthly spend" value={formatMoney(monthlySpend)} />
          <Stat icon={PiggyBank} label="Saved per month" value={formatMoney(monthlySavings)} accent />
        </div>
      </div>
    </header>
  );
}
