/**
 * Derived, read-only views over FleetState. Kept separate from the reducer so
 * ingestion never depends on presentation concerns.
 */

import { TREND_MAX_SAMPLES } from './config';
import { classify, needsAttention } from './statusClassification';
import type { FleetSample, FleetState, RobotState } from '../types/fleet';

export interface FleetSummary {
  total: number;
  working: number;
  attention: number;
  healthy: number;
  avgBattery: number;
}

export function summarise(state: FleetState, nowMs?: number): FleetSummary {
  const robots = Object.values(state.robots);
  const total = robots.length;

  let working = 0;
  let attention = 0;
  let healthy = 0;
  let batterySum = 0;

  for (const robot of robots) {
    batterySum += robot.battery;
    switch (classify(robot, { nowMs })) {
      case 'working':
        working += 1;
        break;
      case 'attention':
        attention += 1;
        break;
      default:
        healthy += 1;
    }
  }

  return {
    total,
    working,
    attention,
    healthy,
    avgBattery: total > 0 ? batterySum / total : 0,
  };
}

/** Snapshot the current fleet as one trend sample. */
export function toSample(state: FleetState, nowMs?: number): FleetSample {
  const s = summarise(state, nowMs);
  return {
    t: state.clockT,
    working: s.working,
    attention: s.attention,
    healthy: s.healthy,
    avgBattery: Math.round(s.avgBattery * 10) / 10,
  };
}

/**
 * Append a sample to the trend series.
 *   - de-dupes on `t` (replay dispatches many events per frame; we want one point)
 *   - keeps the series bounded so live mode doesn't grow without limit
 */
export function pushSample(series: FleetSample[], sample: FleetSample): FleetSample[] {
  const last = series[series.length - 1];
  let next: FleetSample[];
  if (last && last.t === sample.t) {
    next = [...series.slice(0, -1), sample];
  } else {
    next = [...series, sample];
  }
  return next.length > TREND_MAX_SAMPLES ? next.slice(next.length - TREND_MAX_SAMPLES) : next;
}

export interface AttentionItem {
  robot: RobotState;
  reasonKnownAt: number;
}

/** Robots needing attention, worst battery first — the operator's triage list. */
export function attentionRobots(state: FleetState, nowMs?: number): RobotState[] {
  return Object.values(state.robots)
    .filter((r) => needsAttention(r, { nowMs }))
    .sort((a, b) => a.battery - b.battery);
}
