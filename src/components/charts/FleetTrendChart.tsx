import { memo, useMemo } from 'react';
import {
  Area,
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
  const data = useMemo(
    () => series.map((s) => ({ ...s, label: formatClock(s.t) })),
    [series],
  );

  if (data.length < 2) {
    return (
      <div className="grid h-full min-h-[180px] place-items-center rounded-lg border border-dashed border-line text-sm text-ink-lo">
        Collecting trend data…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <h2 className="text-sm font-semibold text-ink-mid">Fleet composition over time</h2>
      <div className="min-h-[200px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7889', fontSize: 11 }}
              stroke="#2b3546"
              minTickGap={40}
            />
            <YAxis
              yAxisId="count"
              allowDecimals={false}
              tick={{ fill: '#6b7889', fontSize: 11 }}
              stroke="#2b3546"
            />
            <YAxis
              yAxisId="battery"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#6b7889', fontSize: 11 }}
              stroke="#2b3546"
              width={34}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#121821',
                border: '1px solid #2b3546',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#a9b6c7' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="working"
              name="Working"
              stackId="fleet"
              stroke={CLASS_VISUALS.working.color}
              fill={CLASS_VISUALS.working.color}
              fillOpacity={0.5}
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
              fillOpacity={0.5}
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
              fillOpacity={0.55}
              isAnimationActive={false}
            />
            <Line
              yAxisId="battery"
              type="monotone"
              dataKey="avgBattery"
              name="Avg battery %"
              stroke="#e8edf4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Memoised: while replay is running the parent re-renders every frame but the
 * trend series only changes when a new timeline sample is appended. */
export const FleetTrendChart = memo(FleetTrendChartBase);
