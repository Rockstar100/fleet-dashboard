import { useEffect, useState } from 'react';
import { formatAge } from '../../lib/format';
import type { FleetMode } from '../../types/fleet';
import type { LiveControls } from '../../hooks/useLiveFeed';

interface Props {
  mode: FleetMode;
  onModeChange: (mode: FleetMode) => void;
  live: LiveControls;
}

export function TopBar({ mode, onModeChange, live }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-1 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/20 text-accent">
          <span className="text-lg leading-none">◈</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-ink-hi">Fleet Console</h1>
          <p className="text-xs text-ink-lo">Peppermint Robotics &middot; site operations</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <FeedState mode={mode} live={live} />
        <ModeSwitch mode={mode} onModeChange={onModeChange} />
      </div>
    </header>
  );
}

function ModeSwitch({ mode, onModeChange }: Pick<Props, 'mode' | 'onModeChange'>) {
  return (
    <div className="flex rounded-md border border-line bg-surface-2 p-0.5" role="group" aria-label="Data source mode">
      {(['replay', 'live'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onModeChange(m)}
          aria-pressed={mode === m}
          className={`rounded px-3 py-1 text-xs font-semibold capitalize transition-colors ${
            mode === m ? 'bg-accent text-surface-0' : 'text-ink-mid hover:text-ink-hi'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
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
      <span className="flex items-center gap-1.5 text-xs text-ink-mid">
        <span className="h-2 w-2 rounded-full bg-sky-400" />
        Replaying recorded log
      </span>
    );
  }

  const healthy = live.running && live.lastTickMs != null && Date.now() - live.lastTickMs < 4000;
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-mid">
      <span className={`h-2 w-2 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {healthy ? (
        <>
          Live feed &middot; ~{live.eventsPerSecond}/s &middot; updated{' '}
          {live.lastTickMs ? formatAge(Date.now() - live.lastTickMs) : '—'}
        </>
      ) : (
        'Live feed starting…'
      )}
    </span>
  );
}
