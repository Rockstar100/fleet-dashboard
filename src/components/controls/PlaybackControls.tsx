import { REPLAY } from '../../lib/config';
import { formatClock } from '../../lib/format';
import { SegmentedControl } from '../ui/SegmentedControl';
import { PauseIcon, PlayIcon, RestartIcon } from '../ui/icons';
import type { ReplayControls } from '../../hooks/useReplay';

interface Props {
  replay: ReplayControls;
}

const SPEED_OPTIONS = REPLAY.speeds.map((s) => ({ value: String(s), label: `${s}×` }));

/** Play / pause / restart, a speed selector, and the dominant scrubbable progress bar. */
export function PlaybackControls({ replay }: Props) {
  const { playing, currentT, progress, speed, atEnd } = replay;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={replay.restart}
          aria-label="Restart replay"
          className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface-2 text-ink-mid transition-colors duration-150 hover:bg-surface-3 hover:text-ink-hi"
        >
          <RestartIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={replay.toggle}
          aria-label={playing ? 'Pause replay' : atEnd ? 'Replay from the start' : 'Play replay'}
          className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-accent/15 text-accent transition-colors duration-150 hover:bg-accent/25"
        >
          {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex min-w-[240px] flex-1 items-center gap-3">
        <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-ink-mid">{formatClock(currentT)}</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => replay.seekFraction(Number(e.target.value) / 1000)}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-accent"
          aria-label="Replay progress"
          aria-valuetext={`${formatClock(currentT)} of ${formatClock(REPLAY.windowSeconds)}`}
        />
        <span className="w-11 shrink-0 text-[11px] tabular-nums text-ink-lo">{formatClock(REPLAY.windowSeconds)}</span>
      </div>

      <SegmentedControl
        value={String(speed)}
        options={SPEED_OPTIONS}
        onChange={(v) => replay.setSpeed(Number(v))}
        ariaLabel="Playback speed"
        size="sm"
      />
    </div>
  );
}
