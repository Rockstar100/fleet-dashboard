import { useState } from 'react';
import { SITE } from '../../lib/config';
import { siteMapUrl } from '../../data';
import { STATUS_VISUALS } from '../../lib/statusVisuals';
import { RobotMarker } from './RobotMarker';
import { useInstantAfter } from '../../hooks/useInstantAfter';
import { Panel } from '../ui/Panel';
import type { RobotState } from '../../types/fleet';

interface Props {
  robots: RobotState[];
  selectedRobotId: string | null;
  /** Ids that pass the current filters; others are dimmed on the map. */
  visibleRobotIds: Set<string>;
  /** Wall clock for stale detection; undefined in replay mode. */
  nowMs?: number;
  /** Bumped by the active replay/live source on a restart or seek. */
  motionToken?: number;
  onSelect: (id: string | null) => void;
}

/**
 * The site map with all robots overlaid — the visual hero of the dashboard.
 *
 * Deliberately width-driven, not height-driven: the box is `width: 100%` of
 * its column with `aspect-ratio: 900/560` computing the height. That fills
 * the column edge to edge with no side gutters, and — just as importantly —
 * means the map's size depends on nothing but its own column's width. It
 * never stretches to fill leftover viewport height and never looks at the
 * Fleet sidebar's height, so switching the selected robot (which can change
 * how tall the sidebar's content is) can never move or resize the map.
 * Every marker sits at `x / 900`, `y / 560` as a percentage of this same box.
 */
export function SiteMap({ robots, selectedRobotId, visibleRobotIds, nowMs, motionToken = 0, onSelect }: Props) {
  const [imageError, setImageError] = useState(false);
  const instant = useInstantAfter(motionToken);

  return (
    <Panel
      className="min-w-0"
      padded={false}
      contentClassName="gap-3 p-3"
      title="Site map"
      meta={
        <>
          {SITE.width}&times;{SITE.height} units &middot; {robots.length} robots
        </>
      }
    >
      <div
        className="relative w-full overflow-hidden rounded-lg bg-surface-0"
        style={{ aspectRatio: `${SITE.width} / ${SITE.height}` }}
        onClick={(e) => {
          // The layout <img> covers the whole plane, so `e.target === e.currentTarget`
          // never fires for a real empty-map click. Deselect whenever the click
          // is not on a marker button (markers stopPropagation themselves).
          if ((e.target as HTMLElement).closest('button')) return;
          onSelect(null);
        }}
      >
        {imageError ? (
          <div className="absolute inset-0 grid place-items-center bg-surface-2 text-sm text-ink-lo">
            Site map image unavailable
          </div>
        ) : (
          <img
            src={siteMapUrl}
            alt="Site layout"
            draggable={false}
            onError={() => setImageError(true)}
            className="absolute inset-0 h-full w-full select-none"
            style={{ objectFit: 'fill' }}
          />
        )}

        {robots.map((robot) => (
          <RobotMarker
            key={robot.robotId}
            robot={robot}
            selected={robot.robotId === selectedRobotId}
            dimmed={!visibleRobotIds.has(robot.robotId)}
            nowMs={nowMs}
            instant={instant}
            onSelect={onSelect}
          />
        ))}
      </div>

      <MapLegend />
    </Panel>
  );
}

function MapLegend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-ink-lo">
      {Object.entries(STATUS_VISUALS).map(([status, visual]) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: visual.color }} />
          {visual.label}
        </span>
      ))}
    </div>
  );
}
