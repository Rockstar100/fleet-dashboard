import { useMemo, useState } from 'react';
import { useFleetController } from '../../hooks/useFleetController';
import { EMPTY_FILTERS, filterRobots, sortRobotsForList } from '../../lib/filterRobots';
import { needsAttention } from '../../lib/statusClassification';
import { TopBar } from './TopBar';
import { SummaryBar } from './SummaryBar';
import { PlaybackControls } from '../controls/PlaybackControls';
import { SiteMap } from '../map/SiteMap';
import { FilterControls } from '../robots/FilterControls';
import { RobotList } from '../robots/RobotList';
import { RobotDetails } from '../robots/RobotDetails';
import { FleetTrendChart } from '../charts/FleetTrendChart';

export function Dashboard() {
  const { robots, mode, switchMode, selectedRobotId, setSelectedRobotId, replay, live, attentionNowMs, trendSeries, summary } =
    useFleetController();

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const attentionCount = useMemo(
    () => robots.filter((r) => needsAttention(r, { nowMs: attentionNowMs })).length,
    [robots, attentionNowMs],
  );

  const listRobots = useMemo(
    () => sortRobotsForList(filterRobots(robots, filters, attentionNowMs), attentionNowMs),
    [robots, filters, attentionNowMs],
  );

  const visibleRobotIds = useMemo(() => new Set(listRobots.map((r) => r.robotId)), [listRobots]);

  const selectedRobot = selectedRobotId ? robots.find((r) => r.robotId === selectedRobotId) ?? null : null;

  return (
    <div className="flex h-full flex-col bg-surface-0 text-ink-hi">
      <TopBar mode={mode} onModeChange={switchMode} live={live} />

      {mode === 'replay' && (
        <div className="border-b border-line bg-surface-1 px-4 py-2">
          <PlaybackControls replay={replay} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
          <SummaryBar summary={summary} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Map + trend */}
            <div className="flex min-h-[560px] flex-col gap-4">
              <div className="min-h-[420px] flex-1 rounded-xl border border-line bg-surface-1 p-3">
                <SiteMap
                  robots={robots}
                  selectedRobotId={selectedRobotId}
                  visibleRobotIds={visibleRobotIds}
                  onSelect={setSelectedRobotId}
                  nowMs={attentionNowMs}
                />
              </div>
              <div className="h-[280px] rounded-xl border border-line bg-surface-1 p-3">
                <FleetTrendChart series={trendSeries} />
              </div>
            </div>

            {/* Discovery + details */}
            <div className="flex flex-col gap-3">
              <FilterControls filters={filters} onChange={setFilters} attentionCount={attentionCount} />
              <div className="flex max-h-[440px] min-h-[240px] flex-col rounded-xl border border-line bg-surface-1 p-2">
                <RobotList
                  robots={listRobots}
                  selectedRobotId={selectedRobotId}
                  onSelect={setSelectedRobotId}
                  nowMs={attentionNowMs}
                />
              </div>
              <RobotDetails
                robot={selectedRobot}
                mode={mode}
                nowMs={attentionNowMs}
                onClear={() => setSelectedRobotId(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
