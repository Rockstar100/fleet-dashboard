/**
 * Drives the recorded log against a virtual clock.
 *
 * Owns a requestAnimationFrame loop and a virtual-time accumulator; delegates the
 * "which events fire in this slice of time" decision to lib/replayClock so that
 * logic stays pure and testable.
 *
 * Emits events by calling the caller's `dispatch` — the exact same entry point
 * the live feed uses.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REPLAY } from '../lib/config';
import { bucketByTime, eventsInWindow, progress } from '../lib/replayClock';
import type { FleetAction } from '../lib/fleetReducer';
import type { FleetEvent } from '../types/fleet';

export interface ReplayControls {
  playing: boolean;
  speed: number;
  /** Current position in the recorded window, in seconds. */
  currentT: number;
  progress: number;
  atEnd: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
  /** Jump to a fraction 0..1 of the window (scrubbing the progress bar). */
  seekFraction: (fraction: number) => void;
}

interface Options {
  events: FleetEvent[];
  /** When false the loop is fully parked (the other mode is active). */
  enabled: boolean;
  onRestart: () => void;
}

/**
 * Start the virtual clock just before 0 so the very first window, `(START, …]`,
 * still includes the `t = 0` bucket (the windowing is half-open on the left).
 */
const START_T = -1;

export function useReplay(dispatch: (action: FleetAction) => void, { events, enabled, onRestart }: Options): ReplayControls {
  const buckets = useMemo(() => bucketByTime(events), [events]);

  // Autostart: a reviewer opening the deployed link should see motion immediately.
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(REPLAY.defaultSpeed);
  const [currentT, setCurrentT] = useState(0);

  const virtualTimeRef = useRef(START_T);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const atEnd = currentT >= REPLAY.windowSeconds;

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastFrameRef.current = null;
  }, []);

  const frame = useCallback(
    (now: number) => {
      if (lastFrameRef.current == null) lastFrameRef.current = now;
      const deltaSeconds = ((now - lastFrameRef.current) / 1000) * speedRef.current;
      lastFrameRef.current = now;

      const from = virtualTimeRef.current;
      const to = Math.min(from + deltaSeconds, REPLAY.windowSeconds);
      const due = eventsInWindow(buckets, from, to);
      if (due.length > 0) dispatch({ type: 'apply', events: due });

      virtualTimeRef.current = to;
      setCurrentT(Math.max(0, to));

      if (to >= REPLAY.windowSeconds) {
        setPlaying(false);
        stopLoop();
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    [buckets, dispatch, stopLoop],
  );

  // Start/stop the rAF loop in response to `playing` / `enabled`.
  useEffect(() => {
    if (enabled && playing) {
      lastFrameRef.current = null;
      rafRef.current = requestAnimationFrame(frame);
      return stopLoop;
    }
    stopLoop();
    return undefined;
  }, [enabled, playing, frame, stopLoop]);

  // Park everything when this mode is switched away from.
  useEffect(() => {
    if (!enabled) setPlaying(false);
  }, [enabled]);

  const play = useCallback(() => {
    if (virtualTimeRef.current >= REPLAY.windowSeconds) {
      virtualTimeRef.current = START_T;
      setCurrentT(0);
      onRestart();
    }
    setPlaying(true);
  }, [onRestart]);

  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);

  const restart = useCallback(() => {
    stopLoop();
    virtualTimeRef.current = START_T;
    setCurrentT(0);
    onRestart();
    setPlaying(true);
  }, [onRestart, stopLoop]);

  const seekFraction = useCallback(
    (fraction: number) => {
      const target = Math.min(1, Math.max(0, fraction)) * REPLAY.windowSeconds;
      // Seeking backwards means replaying from zero (state is not time-indexed);
      // seeking forward just fast-forwards the events between here and there.
      if (target < virtualTimeRef.current) {
        onRestart();
        virtualTimeRef.current = START_T;
      }
      const due = eventsInWindow(buckets, virtualTimeRef.current, target);
      if (due.length > 0) dispatch({ type: 'apply', events: due });
      virtualTimeRef.current = target;
      setCurrentT(target);
    },
    [buckets, dispatch, onRestart],
  );

  return {
    playing,
    speed,
    currentT,
    progress: progress(currentT, REPLAY.windowSeconds),
    atEnd,
    play,
    pause,
    toggle,
    restart,
    setSpeed,
    seekFraction,
  };
}
