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
import { Panel } from '../ui/Panel';

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

  const filtered = listRobots.length !== robots.length;

  return (
    <div className="flex h-full flex-col bg-surface-0 text-ink-hi">
      <TopBar mode={mode} onModeChange={switchMode} live={live} />

      {mode === 'replay' && (
        <div className="shrink-0 border-b border-line bg-surface-1 px-5 py-2.5">
          <PlaybackControls replay={replay} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
          <SummaryBar summary={summary} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Map + trend — the primary operational surface. */}
            <div className="flex flex-col gap-4 lg:min-h-[560px]">
              <SiteMap
                robots={robots}
                selectedRobotId={selectedRobotId}
                visibleRobotIds={visibleRobotIds}
                onSelect={setSelectedRobotId}
                nowMs={attentionNowMs}
                motionToken={mode === 'replay' ? replay.motionToken : 0}
              />
              <FleetTrendChart series={trendSeries} />
            </div>

            {/* Fleet: search, filter, list and details as one cohesive workflow,
                rather than three separately-bordered cards. */}
            <Panel
              className="lg:min-h-[560px]"
              padded={false}
              contentClassName="min-h-0 gap-3 p-3"
              title="Fleet"
              meta={filtered ? `${listRobots.length} of ${robots.length}` : `${robots.length} robots`}
            >
              <FilterControls filters={filters} onChange={setFilters} attentionCount={attentionCount} />

              <div className="flex min-h-[160px] flex-1 flex-col overflow-y-auto border-y border-line py-2">
                <RobotList robots={listRobots} selectedRobotId={selectedRobotId} onSelect={setSelectedRobotId} nowMs={attentionNowMs} />
              </div>

              <RobotDetails robot={selectedRobot} mode={mode} nowMs={attentionNowMs} onClear={() => setSelectedRobotId(null)} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
