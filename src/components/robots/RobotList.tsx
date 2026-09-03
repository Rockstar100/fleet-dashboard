import { memo } from 'react';
import { statusVisual } from '../../lib/statusVisuals';
import { needsAttention } from '../../lib/statusClassification';
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
        icon={<SearchIcon className="h-5 w-5" />}
        title="No robots match"
        description="Try a different search term or clear the status filter."
      />
    );
  }

  return (
    <ul className="-mx-1 flex flex-1 flex-col overflow-y-auto" role="listbox" aria-label="Robots">
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
              className={`relative flex w-full items-center gap-3 rounded-md border-l-2 px-2.5 py-2 text-left transition-colors duration-150 ${
                selected ? 'border-accent bg-accent/[0.08]' : 'border-transparent hover:bg-surface-2'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${attention ? 'attention-pulse' : ''}`}
                style={{ backgroundColor: attention ? '#f87171' : visual.color }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className={`text-[13px] font-semibold ${selected ? 'text-accent' : 'text-ink-hi'}`}>{robot.robotId}</span>
                  <span className="truncate text-[11px] text-ink-lo">{robot.robotType}</span>
                </span>
                <span className={`block text-[11px] ${visual.textClass}`}>{visual.label}</span>
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
