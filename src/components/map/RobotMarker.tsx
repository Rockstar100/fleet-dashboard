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
  /** True for the one render a jump (replay seek/restart) lands on; suppresses the glide. */
  instant?: boolean;
  onSelect: (id: string) => void;
}

/**
 * One robot on the map. Positioned as a percentage of the map box so it stays
 * aligned with layout.png at any size; the marker itself is a fixed pixel size
 * so it never becomes illegible on small screens.
 */
function RobotMarkerBase({ robot, selected, dimmed, nowMs, instant, onSelect }: Props) {
  const visual = statusVisual(robot.status);
  const attention = needsAttention(robot, { nowMs });

  const leftPct = (robot.x / SITE.width) * 100;
  const topPct = (robot.y / SITE.height) * 100;

  // A filtered-out robot still needs to read as "needs attention" — don't let
  // dimming make an urgent robot effectively invisible on the map.
  const dimmedOpacity = attention ? 0.55 : 0.28;

  return (
    <button
      type="button"
      onClick={() => onSelect(robot.robotId)}
      aria-label={`${robot.robotId}, ${visual.label}, battery ${robot.battery.toFixed(0)} percent`}
      aria-pressed={selected}
      title={`${robot.robotId} - ${robot.robotType}\n${visual.label} - ${robot.battery.toFixed(0)}%\n(${robot.x.toFixed(0)}, ${robot.y.toFixed(0)})`}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
        instant ? 'marker-instant' : 'marker-motion'
      }`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        opacity: dimmed && !selected ? dimmedOpacity : 1,
        zIndex: selected ? 30 : attention ? 20 : 10,
      }}
    >
      {/* Selection ring: a distinct halo, not just a border-colour change, so the
          selected robot reads as selected within a glance rather than on close
          inspection. Scales up slightly too ("elevate") for the same reason. */}
      {selected && (
        <span
          className="pointer-events-none absolute -inset-2 rounded-full border-2 border-accent"
          style={{ boxShadow: '0 0 0 4px rgba(63,182,168,0.18)' }}
          aria-hidden="true"
        />
      )}

      <span
        className={`relative flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none shadow-md transition-transform duration-150 ${
          selected ? 'scale-110' : 'group-hover:scale-105'
        } ${attention ? 'attention-pulse' : ''}`}
        style={{
          backgroundColor: selected ? '#e8fbf8' : 'rgba(11,15,20,0.85)',
          color: selected ? '#0b3833' : '#e8edf4',
          borderColor: attention ? '#f87171' : selected ? '#3fb6a8' : visual.color,
          borderWidth: attention ? 2 : selected ? 1.5 : 1,
        }}
      >
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: attention ? '#f87171' : visual.color }}
          aria-hidden="true"
        />
        {robot.robotId}
      </span>
    </button>
  );
}

export const RobotMarker = memo(RobotMarkerBase);
