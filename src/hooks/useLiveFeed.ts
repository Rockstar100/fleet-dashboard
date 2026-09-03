/**
 * Drives the simulated live feed.
 *
 * On enable it snapshots the current fleet state, builds a liveSimulator from it,
 * and then ticks on an interval — each tick parsed through the same eventParser
 * and pushed through the same `dispatch` the replay uses.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE } from '../lib/config';
import { parseEvent } from '../lib/eventParser';
import { createLiveSimulator } from '../lib/liveSimulator';
import type { FleetAction } from '../lib/fleetReducer';
import type { FleetEvent, RobotState } from '../types/fleet';

export interface LiveControls {
  running: boolean;
  /** Wall-clock ms of the most recent tick, for the "last update" read-out. */
  lastTickMs: number | null;
  eventsPerSecond: number;
  elapsedSeconds: number;
}

interface Options {
  enabled: boolean;
  /** Snapshot getter — called once when the feed (re)starts. */
  getSeed: () => RobotState[];
}

export function useLiveFeed(dispatch: (action: FleetAction) => void, { enabled, getSeed }: Options): LiveControls {
  const [running, setRunning] = useState(false);
  const [lastTickMs, setLastTickMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [robotCount, setRobotCount] = useState(0);
  const getSeedRef = useRef(getSeed);
  getSeedRef.current = getSeed;

  /**
   * Mirrors `enabled` synchronously (see the matching comment in useReplay).
   * An interval tick can already be queued when the user switches back to
   * replay; `clearInterval` cancels future ticks but not one already in
   * flight, so the callback itself refuses to dispatch once disabled.
   */
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const tick = useCallback(
    (sim: ReturnType<typeof createLiveSimulator>) => {
      if (!enabledRef.current) return;
      const now = Date.now();
      const parsed: FleetEvent[] = [];
      for (const raw of sim.tick()) {
        const { event } = parseEvent(raw, 'live');
        if (event) parsed.push(event);
      }
      if (parsed.length > 0) dispatch({ type: 'apply', events: parsed, nowMs: now });
      setLastTickMs(now);
      setElapsedSeconds(sim.elapsedSeconds);
    },
    [dispatch],
  );

  useEffect(() => {
    if (!enabled) {
      setRunning(false);
      return undefined;
    }
    const seed = getSeedRef.current();
    const sim = createLiveSimulator(seed);
    setRobotCount(seed.length);
    setRunning(true);
    setElapsedSeconds(0);
    tick(sim); // emit immediately so the feed isn't blank for one interval
    const id = window.setInterval(() => tick(sim), LIVE.tickMs);
    return () => {
      window.clearInterval(id);
      setRunning(false);
    };
  }, [enabled, tick]);

  return {
    running,
    lastTickMs,
    eventsPerSecond: robotCount > 0 ? Math.round((1000 / LIVE.tickMs) * robotCount) : 0,
    elapsedSeconds,
  };
}
