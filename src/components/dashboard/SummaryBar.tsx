import type { FleetSummary } from '../../lib/fleetMetrics';

interface Props {
  summary: FleetSummary;
}

/** The four headline numbers an operator glances at first. */
export function SummaryBar({ summary }: Props) {
  const tiles = [
    { label: 'Total robots', value: summary.total, tone: 'text-ink-hi' },
    { label: 'Working', value: summary.working, tone: 'text-emerald-300' },
    { label: 'Needs attention', value: summary.attention, tone: 'text-red-300' },
    { label: 'Avg battery', value: `${summary.avgBattery.toFixed(0)}%`, tone: 'text-ink-hi' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg border border-line bg-surface-1 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-ink-lo">{tile.label}</div>
          <div className={`mt-0.5 text-xl font-semibold tabular-nums ${tile.tone}`}>{tile.value}</div>
        </div>
      ))}
    </div>
  );
}
