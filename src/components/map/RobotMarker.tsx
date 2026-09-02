import { memo } from 'react';
import { SITE } from '../../lib/config';
import { statusVisual } from '../../lib/statusVisuals';
import { needsAttention } from '../../lib/statusClassification';
import type { RobotState } from '../../types/fleet';

interface Props {
  robot: RobotState;
  selected: boolean;
  dimmed: boolean;
  nowMs?: number;
  onSelect: (id: string) => void;
}

/**
 * One robot on the map. Positioned as a percentage of the map box so it stays
 * aligned with layout.png at any size; the marker itself is a fixed pixel size
 * so it never becomes illegible on small screens.
 */
function RobotMarkerBase({ robot, selected, dimmed, nowMs, onSelect }: Props) {
  const visual = statusVisual(robot.status);
  const attention = needsAttention(robot, { nowMs });

  const leftPct = (robot.x / SITE.width) * 100;
  const topPct = (robot.y / SITE.height) * 100;

  return (
    <button
      type="button"
      onClick={() => onSelect(robot.robotId)}
      aria-label={`${robot.robotId}, ${visual.label}, battery ${robot.battery.toFixed(0)} percent`}
      aria-pressed={selected}
      className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-full"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        opacity: dimmed && !selected ? 0.28 : 1,
        transition: 'left 240ms linear, top 240ms linear, opacity 160ms ease',
        zIndex: selected ? 30 : attention ? 20 : 10,
      }}
    >
      <span
        className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold leading-none shadow-md ${
          attention ? 'attention-pulse' : ''
        }`}
        style={{
          backgroundColor: selected ? '#ffffff' : 'rgba(11,15,20,0.82)',
          color: selected ? '#0b0f14' : '#e8edf4',
          borderColor: attention ? '#f87171' : selected ? '#ffffff' : visual.color,
          borderWidth: attention ? 2 : 1,
        }}
      >
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: visual.color }} />
        {robot.robotId}
      </span>
    </button>
  );
}

export const RobotMarker = memo(RobotMarkerBase);
