import { useEffect, useState } from 'react';
import { formatAge } from '../../lib/format';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { FleetMode } from '../../types/fleet';
import type { LiveControls } from '../../hooks/useLiveFeed';

interface Props {
  mode: FleetMode;
  onModeChange: (mode: FleetMode) => void;
  live: LiveControls;
}

const MODE_OPTIONS = [
  { value: 'replay' as const, label: 'Replay' },
  { value: 'live' as const, label: 'Live' },
];

export function TopBar({ mode, onModeChange, live }: Props) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface-1 px-5">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent">
          <span className="text-base leading-none">&#9670;</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-[13.5px] font-semibold tracking-tight text-ink-hi">Fleet Console</h1>
          <p className="text-[11px] text-ink-lo">Peppermint Robotics &middot; site operations</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <FeedState mode={mode} live={live} />
        <SegmentedControl value={mode} options={MODE_OPTIONS} onChange={onModeChange} ariaLabel="Data source mode" />
      </div>
    </header>
  );
}

function FeedState({ mode, live }: Pick<Props, 'mode' | 'live'>) {
  // Re-render once a second so the "updated Ns ago" read-out stays current.
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (mode === 'replay') {
    return (
      <span className="hidden items-center gap-1.5 text-[11px] text-ink-mid sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
        Replaying recorded log
      </span>
    );
  }

  const healthy = live.running && live.lastTickMs != null && Date.now() - live.lastTickMs < 4000;
  return (
    <span className="hidden items-center gap-1.5 text-[11px] text-ink-mid sm:flex" role="status">
      <span
        className={`h-1.5 w-1.5 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-amber-400'}`}
        aria-hidden="true"
      />
      {healthy ? (
        <>
          Live &middot; ~{live.eventsPerSecond}/s &middot; {live.lastTickMs ? formatAge(Date.now() - live.lastTickMs) : '—'}
        </>
      ) : (
        'Live feed starting…'
      )}
    </span>
  );
}
