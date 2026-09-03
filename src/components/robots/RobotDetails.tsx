import { CLASS_VISUALS, statusVisual } from '../../lib/statusVisuals';
import { attentionReason, classify } from '../../lib/statusClassification';
import { formatAge, formatClock, titleCase } from '../../lib/format';
import { BatteryBar } from './BatteryBar';
import { EmptyState } from '../ui/EmptyState';
import { AlertIcon, BotIcon, CheckIcon, XIcon } from '../ui/icons';
import type { FleetMode, RobotState } from '../../types/fleet';

interface Props {
  robot: RobotState | null;
  mode: FleetMode;
  nowMs?: number;
  onClear: () => void;
}

/**
 * A fixed layout footprint shared by every robot, healthy or not.
 *
 * The status/alert region below the identity row is always rendered — never
 * conditionally mounted — and always the same one- or two-line block. A
 * healthy robot gets "No active alerts" in that exact spot instead of the
 * block disappearing; an attention robot's reason is clamped to two lines
 * instead of growing the block to fit. That is what keeps selecting between
 * robots from resizing this panel (and, since the two columns don't stretch
 * to match each other — see Dashboard.tsx — from moving the map or trend
 * chart either).
 */
const STATUS_AREA_MIN_HEIGHT = 'min-h-[44px]';

export function RobotDetails({ robot, mode, nowMs, onClear }: Props) {
  if (!robot) {
    return (
      <EmptyState
        className="min-h-[220px]"
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

  const telemetry: Array<[string, string]> = [
    ['Position', `${robot.x.toFixed(0)}, ${robot.y.toFixed(0)}`],
    [mode === 'replay' ? 'Event time' : 'Feed time', formatClock(robot.lastEventT < 0 ? 0 : robot.lastEventT)],
    ['Last update', ageMs == null ? '—' : formatAge(ageMs)],
    ['Updates', String(robot.updates)],
    // Always render the task row so selecting a robot that once saw a
    // task_event doesn't grow the panel relative to one that never did.
    ['Last task', robot.lastTaskEvent ? titleCase(robot.lastTaskEvent) : '—'],
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Identity: the one thing the operator reads first. */}
      <div className="flex items-start justify-between gap-2">
        <div className="leading-tight">
          <h3 className="text-[15px] font-semibold text-ink-hi">{robot.robotId}</h3>
          <p className="text-xs text-ink-lo">{titleCase(robot.robotType)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="focus-ring grid h-6 w-6 shrink-0 place-items-center rounded text-ink-lo transition-colors duration-150 hover:bg-surface-2 hover:text-ink-hi"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Raw status + operator interpretation, shown as two small badges rather
          than fused text — a status can be "on_mission" and still classify
          as attention (stale), and conflating them reads as contradictory. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium ${visual.textClass}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: visual.color }} aria-hidden="true" />
          {visual.label}
        </span>
        <span className={`text-[11px] font-medium ${CLASS_VISUALS[cls].textClass}`}>{CLASS_VISUALS[cls].label}</span>
      </div>

      {/* Reserved status area: same footprint whether calm or urgent. */}
      {reason ? (
        <div className={`flex items-start gap-2 rounded-md border border-red-500/25 bg-red-500/[0.06] px-2.5 py-2 text-xs text-red-200 ${STATUS_AREA_MIN_HEIGHT}`}>
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
          <span className="line-clamp-2">{reason}</span>
        </div>
      ) : (
        <div className={`flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-2 text-xs text-ink-lo ${STATUS_AREA_MIN_HEIGHT}`}>
          <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>No active alerts</span>
        </div>
      )}

      {/* Battery: the single most action-relevant number, own row. */}
      <div className="flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-2">
        <span className="text-xs text-ink-lo">Battery</span>
        <BatteryBar value={robot.battery} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
        {telemetry.map(([label, value]) => (
          <div key={label}>
            <div className="text-[10.5px] uppercase tracking-wide text-ink-lo">{label}</div>
            <div className="tabular-nums text-ink-hi">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
