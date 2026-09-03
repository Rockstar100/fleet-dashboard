import type { ReactNode } from 'react';
import { CLASS_VISUALS, statusVisual } from '../../lib/statusVisuals';
import { attentionReason, classify } from '../../lib/statusClassification';
import { formatAge, formatClock, titleCase } from '../../lib/format';
import { BatteryBar } from './BatteryBar';
import { EmptyState } from '../ui/EmptyState';
import { AlertIcon, BotIcon, XIcon } from '../ui/icons';
import type { FleetMode, RobotState } from '../../types/fleet';

interface Props {
  robot: RobotState | null;
  mode: FleetMode;
  nowMs?: number;
  onClear: () => void;
}

export function RobotDetails({ robot, mode, nowMs, onClear }: Props) {
  if (!robot) {
    return (
      <EmptyState
        icon={<BotIcon className="h-6 w-6" />}
        title="Select a robot"
        description="Choose a robot on the map or fleet list to inspect its telemetry."
      />
    );
  }

  const visual = statusVisual(robot.status);
  const cls = classify(robot, { nowMs });
  const reason = attentionReason(robot, { nowMs });
  const ageMs = robot.lastSeenWallMs ? Date.now() - robot.lastSeenWallMs : null;

  const metaRows: Array<[string, ReactNode]> = [
    ['Position', `(${robot.x.toFixed(1)}, ${robot.y.toFixed(1)})`],
    [
      mode === 'replay' ? 'Event time' : 'Feed time',
      <span key="t" className="tabular-nums">
        {formatClock(robot.lastEventT < 0 ? 0 : robot.lastEventT)}
      </span>,
    ],
    ['Last update', ageMs == null ? '—' : formatAge(ageMs)],
    ['Updates applied', robot.updates],
  ];
  if (robot.lastTaskEvent) {
    metaRows.push(['Last task event', titleCase(robot.lastTaskEvent)]);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Identity + status: the one thing the operator reads first. */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: cls === 'attention' ? '#f87171' : visual.color }}
            aria-hidden="true"
          />
          <div className="leading-tight">
            <h3 className="text-[15px] font-semibold text-ink-hi">
              {robot.robotId} <span className="font-normal text-ink-lo">&middot; {titleCase(robot.robotType)}</span>
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs">
              <span className={visual.textClass}>{visual.label}</span>
              <span className="text-ink-lo">&middot;</span>
              <span className={CLASS_VISUALS[cls].textClass}>{CLASS_VISUALS[cls].label}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-lo transition-colors duration-150 hover:bg-surface-2 hover:text-ink-hi"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {reason && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/25 bg-red-500/[0.06] px-2.5 py-2 text-xs text-red-200">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
          <span>{reason}</span>
        </div>
      )}

      {/* Battery gets its own row — the single most action-relevant number. */}
      <div className="flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-2">
        <span className="text-xs text-ink-lo">Battery</span>
        <BatteryBar value={robot.battery} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        {metaRows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-lo">{label}</dt>
            <dd className="text-right text-ink-hi">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
