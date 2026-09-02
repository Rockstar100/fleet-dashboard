/**
 * Accumulates the fleet-level trend series as state advances.
 *
 * Presentation-only: it reads FleetState and never writes it. The series resets
 * whenever `resetKey` changes (mode switch / replay restart) so replay and live
 * each get a clean timeline.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { pushSample, summarise, toSample } from '../lib/fleetMetrics';
import type { FleetSample, FleetState } from '../types/fleet';

export function useFleetMetrics(state: FleetState, resetKey: string, nowMs?: number) {
  const [series, setSeries] = useState<FleetSample[]>([]);
  const lastTRef = useRef<number>(-1);

  useEffect(() => {
    setSeries([]);
    lastTRef.current = -1;
  }, [resetKey]);

  useEffect(() => {
    if (state.clockT === lastTRef.current) return;
    lastTRef.current = state.clockT;
    setSeries((prev) => pushSample(prev, toSample(state, nowMs)));
  }, [state, nowMs]);

  const summary = useMemo(() => summarise(state, nowMs), [state, nowMs]);

  return { series, summary };
}
