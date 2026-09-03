interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'positive' | 'attention';
}

/**
 * One KPI tile. Deliberately quiet: no icon badge, no full-card accent
 * border — just label, a dominant number, and a small contextual hint. Tone
 * only colors the number itself, so "needs attention" reads as urgent
 * without turning the whole card into an alert box.
 */
export function MetricCard({ label, value, hint, tone = 'default' }: Props) {
  const valueColor = tone === 'attention' ? 'text-red-400' : tone === 'positive' ? 'text-emerald-400' : 'text-ink-hi';

  return (
    <div className="rounded-xl border border-line bg-surface-1 px-4 py-3.5">
      <div className="text-[11px] font-medium text-ink-lo">{label}</div>
      <div className={`mt-1.5 text-[28px] font-semibold leading-none tabular-nums ${valueColor}`}>{value}</div>
      {hint && <div className="mt-2 text-[11px] text-ink-lo">{hint}</div>}
    </div>
  );
}
