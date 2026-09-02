/**
 * The single owner of fleet state and playback.
 *
 * There is exactly one `useReducer(fleetReducer)` here. Replay and live are two
 * event *producers* that both call its `dispatch`; switching mode rebases the
 * state (keeps robots where they are, rewinds the clock) so the incoming source
 * starts clean. Every view in the app reads from the state this hook returns.
 */

import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { fleetReducer, initFleetState } from '../lib/fleetReducer';
import { recordedEvents, roster } from '../data';
import { useReplay } from './useReplay';
import { useLiveFeed } from './useLiveFeed';
import { useFleetMetrics } from './useFleetMetrics';
import type { FleetMode, RobotId } from '../types/fleet';

export function useFleetController() {
  const [state, dispatch] = useReducer(fleetReducer, roster, initFleetState);
  const [mode, setMode] = useState<FleetMode>('replay');
  const [selectedRobotId, setSelectedRobotId] = useState<RobotId | null>(null);

  // Bump on any timeline restart so the metrics series clears.
  const [epoch, setEpoch] = useState(0);
  const resetTimeline = useCallback(() => {
    dispatch({ type: 'reset', roster });
    setEpoch((e) => e + 1);
  }, []);

  const replay = useReplay(dispatch, {
    events: recordedEvents,
    enabled: mode === 'replay',
    onRestart: resetTimeline,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const live = useLiveFeed(dispatch, {
    enabled: mode === 'live',
    getSeed: useCallback(() => Object.values(stateRef.current.robots), []),
  });

  const switchMode = useCallback(
    (next: FleetMode) => {
      if (next === mode) return;
      setMode(next);
      if (next === 'live') {
        // Keep robots visually in place; rewind the clock so live `t` isn't stale.
        dispatch({ type: 'rebase', from: stateRef.current });
        setEpoch((e) => e + 1);
      } else {
        // Back to replay = play the recorded log from the top.
        replay.restart();
      }
    },
    [mode, replay],
  );

  /**
   * Wall-clock reference for the "no telemetry / stale" attention rule. Only
   * meaningful for the live feed — in replay the wall clock is unrelated to the
   * recorded timeline (a paused replay must not flag every robot as stale).
   */
  const attentionNowMs = mode === 'live' ? Date.now() : undefined;

  const { series, summary } = useFleetMetrics(state, `${mode}:${epoch}`, attentionNowMs);

  const robots = useMemo(() => Object.values(state.robots), [state]);

  return {
    state,
    robots,
    mode,
    switchMode,
    selectedRobotId,
    setSelectedRobotId,
    replay,
    live,
    attentionNowMs,
    trendSeries: series,
    summary,
  };
}
