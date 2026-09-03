import { memo, useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatClock } from '../../lib/format';
import { CLASS_VISUALS } from '../../lib/statusVisuals';
import { Panel } from '../ui/Panel';
import { EmptyState } from '../ui/EmptyState';
import { ActivityIcon } from '../ui/icons';
import type { FleetSample } from '../../types/fleet';

interface Props {
  series: FleetSample[];
}

/**
 * Fleet composition over the observed window: a stacked count of robots that are
 * working / healthy / needing attention, plus average battery on a second axis.
 * This is a genuine time series — it answers "how is the fleet trending", not
 * "what is the fleet doing right now".
 */
function FleetTrendChartBase({ series }: Props) {
  const data = useMemo(() => series.map((s) => ({ ...s, label: formatClock(s.t) })), [series]);

  return (
    <Panel className="h-[280px]" title="Fleet trend" meta="operational class & avg battery">
      {data.length < 2 ? (
        <EmptyState icon={<ActivityIcon className="h-5 w-5" />} title="Collecting trend data…" />
      ) : (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1d2632" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6b7889', fontSize: 11 }} stroke="#2b3546" minTickGap={40} />
            <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: '#6b7889', fontSize: 11 }} stroke="#2b3546" />
            <YAxis
              yAxisId="battery"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#6b7889', fontSize: 11 }}
              stroke="#2b3546"
              width={34}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#121821',
                border: '1px solid #2b3546',
                borderRadius: 10,
                fontSize: 12,
                padding: '8px 10px',
              }}
              labelStyle={{ color: '#a9b6c7', marginBottom: 4 }}
              itemStyle={{ padding: 0 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" iconSize={8} />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="working"
              name="Working"
              stackId="fleet"
              stroke={CLASS_VISUALS.working.color}
              fill={CLASS_VISUALS.working.color}
              fillOpacity={0.35}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="healthy"
              name="Healthy"
              stackId="fleet"
              stroke={CLASS_VISUALS.healthy.color}
              fill={CLASS_VISUALS.healthy.color}
              fillOpacity={0.3}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="attention"
              name="Attention"
              stackId="fleet"
              stroke={CLASS_VISUALS.attention.color}
              fill={CLASS_VISUALS.attention.color}
              fillOpacity={0.4}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Line
              yAxisId="battery"
              type="monotone"
              dataKey="avgBattery"
              name="Avg battery"
              stroke="#e8edf4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

/** Memoised: while replay is running the parent re-renders every frame but the
 * trend series only changes when a new timeline sample is appended. */
export const FleetTrendChart = memo(FleetTrendChartBase);
