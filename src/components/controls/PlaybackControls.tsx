import { REPLAY } from '../../lib/config';
import { formatClock } from '../../lib/format';
import type { ReplayControls } from '../../hooks/useReplay';

interface Props {
  replay: ReplayControls;
}

/** Play / pause / restart, speed selector, and a scrubbable progress bar. */
export function PlaybackControls({ replay }: Props) {
  const { playing, currentT, progress, speed, atEnd } = replay;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={replay.restart}
          className="rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink-mid hover:bg-surface-3"
          aria-label="Restart replay"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={replay.toggle}
          className="rounded-md border border-line bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25"
          aria-label={playing ? 'Pause replay' : 'Play replay'}
        >
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
        {REPLAY.speeds.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => replay.setSpeed(s)}
            aria-pressed={speed === s}
            className={`rounded px-1.5 py-1 text-xs font-medium tabular-nums ${
              speed === s ? 'bg-accent text-surface-0' : 'text-ink-lo hover:text-ink-mid'
            }`}
          >
            {s}&times;
          </button>
        ))}
      </div>

      <div className="flex min-w-[220px] flex-1 items-center gap-2">
        <span className="tabular-nums text-xs text-ink-mid">{formatClock(currentT)}</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => replay.seekFraction(Number(e.target.value) / 1000)}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-accent"
          aria-label="Replay progress"
        />
        <span className="tabular-nums text-xs text-ink-lo">{formatClock(REPLAY.windowSeconds)}</span>
      </div>
    </div>
  );
}
