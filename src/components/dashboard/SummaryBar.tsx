import type { FleetSummary } from '../../lib/fleetMetrics';
import { MetricCard } from '../ui/MetricCard';
import { ActivityIcon, AlertIcon, BatteryIcon, BotIcon } from '../ui/icons';

interface Props {
  summary: FleetSummary;
}

/** The four headline numbers an operator glances at first. */
export function SummaryBar({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard label="Total robots" value={summary.total} icon={<BotIcon className="h-4 w-4" />} />
      <MetricCard
        label="Working"
        value={summary.working}
        tone="positive"
        hint={`${summary.healthy} healthy`}
        icon={<ActivityIcon className="h-4 w-4" />}
      />
      <MetricCard
        label="Needs attention"
        value={summary.attention}
        tone={summary.attention > 0 ? 'attention' : 'default'}
        icon={<AlertIcon className="h-4 w-4" />}
      />
      <MetricCard label="Avg battery" value={`${summary.avgBattery.toFixed(0)}%`} icon={<BatteryIcon className="h-4 w-4" />} />
    </div>
  );
}
