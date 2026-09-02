import { ATTENTION } from '../../lib/config';

interface Props {
  value: number;
  className?: string;
}

/** Compact battery gauge. Turns amber below the low-battery threshold. */
export function BatteryBar({ value, className = '' }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const low = pct <= ATTENTION.lowBatteryPct;
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-full rounded-full ${low ? 'bg-amber-400' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`tabular-nums text-xs ${low ? 'text-amber-300' : 'text-ink-mid'}`}>{pct.toFixed(0)}%</span>
    </div>
  );
}
