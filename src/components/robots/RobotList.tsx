import { memo } from 'react';
import { statusVisual } from '../../lib/statusVisuals';
import { needsAttention } from '../../lib/statusClassification';
import { titleCase } from '../../lib/format';
import { BatteryBar } from './BatteryBar';
import { EmptyState } from '../ui/EmptyState';
import { SearchIcon } from '../ui/icons';
import type { RobotState } from '../../types/fleet';

interface Props {
  robots: RobotState[];
  selectedRobotId: string | null;
  nowMs?: number;
  onSelect: (id: string) => void;
}

function RobotListBase({ robots, selectedRobotId, nowMs, onSelect }: Props) {
  if (robots.length === 0) {
    return (
      <EmptyState
        className="flex-1"
        icon={<SearchIcon className="h-5 w-5" />}
        title="No robots match"
        description="Try a different search term or clear the status filter."
      />
    );
  }

  return (
    <ul className="-mx-1 flex min-w-0 flex-1 flex-col divide-y divide-line/60" role="listbox" aria-label="Robots">
      {robots.map((robot) => {
        const visual = statusVisual(robot.status);
        const attention = needsAttention(robot, { nowMs });
        const selected = robot.robotId === selectedRobotId;
        return (
          <li key={robot.robotId} className="px-1">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(robot.robotId)}
              className={`relative flex w-full items-center gap-3 rounded-md border-l-2 px-2.5 py-2.5 text-left transition-colors duration-150 ${
                selected ? 'border-accent bg-accent/[0.08]' : 'border-transparent hover:bg-surface-2'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center" aria-hidden="true">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.color }} />
                {attention && (
                  <span className="attention-pulse absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full border border-surface-1 bg-red-500" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[13.5px] font-semibold ${selected ? 'text-accent' : 'text-ink-hi'}`}>
                  {robot.robotId}
                </span>
                <span className="block truncate text-[11.5px] text-ink-lo">
                  {titleCase(robot.robotType)} &middot; <span className={visual.textClass}>{visual.label}</span>
                </span>
              </span>
              <BatteryBar value={robot.battery} className="shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export const RobotList = memo(RobotListBase);
