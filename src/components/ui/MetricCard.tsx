import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'attention';
}

/** One KPI tile. The number is the point — everything else is secondary. */
export function MetricCard({ label, value, hint, icon, tone = 'default' }: Props) {
  const border = tone === 'attention' ? 'border-red-500/25' : 'border-line';
  const iconBox = tone === 'attention' ? 'bg-red-500/10 text-red-300' : 'bg-surface-2 text-ink-lo';
  const valueColor = tone === 'attention' ? 'text-red-300' : tone === 'positive' ? 'text-emerald-300' : 'text-ink-hi';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border ${border} bg-surface-1 px-4 py-3`}>
      <div className="min-w-0">
        <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-lo">{label}</div>
        <div className={`mt-1 text-[26px] font-semibold leading-none tabular-nums ${valueColor}`}>{value}</div>
        {hint && <div className="mt-1.5 text-[11px] text-ink-lo">{hint}</div>}
      </div>
      {icon && <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconBox}`}>{icon}</div>}
    </div>
  );
}
