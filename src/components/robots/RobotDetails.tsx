import type { ReactNode } from 'react';
import { CLASS_VISUALS, statusVisual } from '../../lib/statusVisuals';
import { attentionReason, classify } from '../../lib/statusClassification';
import { formatAge, formatClock, titleCase } from '../../lib/format';
import { BatteryBar } from './BatteryBar';
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
      <div className="grid place-items-center rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-lo">
        Select a robot on the map or in the list to inspect it.
      </div>
    );
  }

  const visual = statusVisual(robot.status);
  const cls = classify(robot, { nowMs });
  const reason = attentionReason(robot, { nowMs });
  const ageMs = robot.lastSeenWallMs ? Date.now() - robot.lastSeenWallMs : null;

  const rows: Array<[string, ReactNode]> = [
    ['Robot ID', robot.robotId],
    ['Type', titleCase(robot.robotType)],
    [
      'Status',
      <span key="s" className={`font-medium ${visual.textClass}`}>
        {visual.label}
      </span>,
    ],
    [
      'Operational class',
      <span key="c" className={CLASS_VISUALS[cls].textClass}>
        {CLASS_VISUALS[cls].label}
      </span>,
    ],
    ['Battery', <BatteryBar key="b" value={robot.battery} />],
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
    rows.push(['Last task event', titleCase(robot.lastTaskEvent)]);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-1 p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: visual.color }} />
          <h3 className="text-base font-semibold text-ink-hi">{robot.robotId}</h3>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-ink-lo hover:text-ink-mid" aria-label="Clear selection">
          Clear
        </button>
      </div>

      {reason && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200">
          <span className="font-semibold">Attention: </span>
          {reason}
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-lo">{label}</dt>
            <dd className="text-right text-ink-hi">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
