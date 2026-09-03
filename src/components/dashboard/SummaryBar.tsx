import type { FleetSummary } from '../../lib/fleetMetrics';
import { MetricCard } from '../ui/MetricCard';

interface Props {
  summary: FleetSummary;
}

/** The four headline numbers an operator glances at first. */
export function SummaryBar({ summary }: Props) {
  const attentionHint =
    summary.attention === 0 ? 'None right now' : summary.attention === 1 ? '1 robot' : `${summary.attention} robots`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard label="Total fleet" value={summary.total} hint={`${summary.total} reporting`} />
      <MetricCard
        label="Working"
        value={summary.working}
        tone="positive"
        hint={summary.total > 0 ? `${Math.round((summary.working / summary.total) * 100)}% of fleet` : undefined}
      />
      <MetricCard
        label="Needs attention"
        value={summary.attention}
        tone={summary.attention > 0 ? 'attention' : 'default'}
        hint={attentionHint}
      />
      <MetricCard label="Avg battery" value={`${summary.avgBattery.toFixed(0)}%`} hint={summary.avgBattery >= 40 ? 'Nominal' : 'Running low'} />
    </div>
  );
}
