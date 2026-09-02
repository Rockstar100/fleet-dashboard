import { useState } from 'react';
import { SITE } from '../../lib/config';
import { siteMapUrl } from '../../data';
import { STATUS_VISUALS } from '../../lib/statusVisuals';
import { RobotMarker } from './RobotMarker';
import type { RobotState } from '../../types/fleet';

interface Props {
  robots: RobotState[];
  selectedRobotId: string | null;
  /** Ids that pass the current filters; others are dimmed on the map. */
  visibleRobotIds: Set<string>;
  /** Wall clock for stale detection; undefined in replay mode. */
  nowMs?: number;
  onSelect: (id: string | null) => void;
}

/**
 * The site map with all robots overlaid.
 *
 * Coordinate mapping: the map box is locked to layout.png's native aspect ratio
 * (900 x 560) via `aspect-ratio`, and the image fills it exactly. Every marker is
 * then placed at `x / 900` and `y / 560` as a percentage. No resize listeners, no
 * canvas maths — the browser keeps markers aligned as the box scales.
 */
export function SiteMap({ robots, selectedRobotId, visibleRobotIds, nowMs, onSelect }: Props) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-mid">Site map</h2>
        <span className="text-xs text-ink-lo">
          {SITE.width}&times;{SITE.height} units &middot; {robots.length} robots
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg border border-line bg-surface-1">
        <div
          className="relative mx-auto w-full"
          style={{ aspectRatio: `${SITE.width} / ${SITE.height}`, maxHeight: '100%' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(null);
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
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-mid">
      {Object.entries(STATUS_VISUALS).map(([status, visual]) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: visual.color }} />
          {visual.label}
        </span>
      ))}
    </div>
  );
}
