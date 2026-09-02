import { memo } from 'react';
import { statusVisual } from '../../lib/statusVisuals';
import { needsAttention } from '../../lib/statusClassification';
import { BatteryBar } from './BatteryBar';
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
      <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-lo">
        No robots match the current filters.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 overflow-y-auto pr-1" role="listbox" aria-label="Robots">
      {robots.map((robot) => {
        const visual = statusVisual(robot.status);
        const attention = needsAttention(robot, { nowMs });
        const selected = robot.robotId === selectedRobotId;
        return (
          <li key={robot.robotId}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(robot.robotId)}
              className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors ${
                selected
                  ? 'border-accent bg-accent/10'
                  : 'border-transparent bg-surface-1 hover:border-line hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${attention ? 'attention-pulse' : ''}`}
                    style={{ backgroundColor: visual.color }}
                  />
                  <span className="font-semibold text-ink-hi">{robot.robotId}</span>
                  <span className="text-xs text-ink-lo">{robot.robotType}</span>
                </div>
                <BatteryBar value={robot.battery} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={visual.textClass}>{visual.label}</span>
                <span className="tabular-nums text-ink-lo">
                  ({robot.x.toFixed(0)}, {robot.y.toFixed(0)})
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export const RobotList = memo(RobotListBase);
