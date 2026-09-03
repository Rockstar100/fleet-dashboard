/**
 * The one place that decides what a status *means* for an operator.
 *
 * The challenge deliberately leaves this open. Our call:
 *
 *   working   — the robot is doing useful work right now: `active`, `on_mission`
 *   healthy   — fine, just not working: `idle`, `charging`
 *   attention — the operator should look at it: `blocked`, `error`, `maintenance`,
 *               `offline`, OR battery <= 20% while not charging, OR gone stale.
 *
 * Rationale:
 *   - `blocked`/`error` are clearly stuck. `maintenance` means a human is (or should
 *     be) involved. `offline` means we've lost telemetry — you can't manage what you
 *     can't see, so it needs attention.
 *   - `charging` is intentional downtime, not a problem, so it's "healthy" not
 *     "attention" — unless something else about the robot is wrong.
 *   - Low battery is a leading indicator: flag it before the robot strands itself.
 *
 * To change the policy, edit the sets / threshold below. Nothing else in the app
 * hard-codes a status-to-meaning mapping.
 */

import { ATTENTION } from './config';
import type { RobotState, RobotStatus } from '../types/fleet';

export type OperationalClass = 'working' | 'healthy' | 'attention';

export const WORKING_STATUSES: ReadonlySet<RobotStatus> = new Set<RobotStatus>(['active', 'on_mission']);

export const HEALTHY_STATUSES: ReadonlySet<RobotStatus> = new Set<RobotStatus>(['idle', 'charging']);

export const ATTENTION_STATUSES: ReadonlySet<RobotStatus> = new Set<RobotStatus>([
  'blocked',
  'error',
  'maintenance',
  'offline',
]);

export interface ClassifyOptions {
  /** Wall-clock now, for stale detection. Omit to skip the staleness check. */
  nowMs?: number;
}

export function isLowBattery(robot: Pick<RobotState, 'battery' | 'status'>): boolean {
  return robot.battery <= ATTENTION.lowBatteryPct && robot.status !== 'charging';
}

export function isStale(robot: Pick<RobotState, 'lastSeenWallMs'>, nowMs: number): boolean {
  return nowMs - robot.lastSeenWallMs > ATTENTION.staleAfterMs;
}

/** Bucket a robot into exactly one operational class. `attention` wins over the rest. */
export function classify(robot: RobotState, opts: ClassifyOptions = {}): OperationalClass {
  if (needsAttention(robot, opts)) return 'attention';
  if (WORKING_STATUSES.has(robot.status)) return 'working';
  return 'healthy';
}

export function needsAttention(robot: RobotState, opts: ClassifyOptions = {}): boolean {
  if (ATTENTION_STATUSES.has(robot.status)) return true;
  if (isLowBattery(robot)) return true;
  if (opts.nowMs != null && isStale(robot, opts.nowMs)) return true;
  return false;
}

/**
 * Human-readable reason(s) shown in the robot detail panel. `null` when fine.
 *
 * A robot can trip more than one clause at once (e.g. `error` + low battery),
 * so this lists every applicable reason rather than picking just one — but
 * the *order* is a fixed, deterministic priority so the most actionable fact
 * always reads first, regardless of which clauses happen to be true:
 *   1. an explicit fault status (the robot itself is reporting a problem)
 *   2. stale telemetry (we've lost track of it, independent of last status)
 *   3. low battery (a leading indicator, least urgent of the three)
 */
export function attentionReason(robot: RobotState, opts: ClassifyOptions = {}): string | null {
  const reasons: string[] = [];
  switch (robot.status) {
    case 'error':
      reasons.push('Reporting an error state');
      break;
    case 'blocked':
      reasons.push('Blocked — path obstructed');
      break;
    case 'maintenance':
      reasons.push('In maintenance');
      break;
    case 'offline':
      reasons.push('Offline — not reporting');
      break;
    default:
      break;
  }
  if (opts.nowMs != null && isStale(robot, opts.nowMs)) {
    reasons.push('No telemetry received recently (stale)');
  }
  if (isLowBattery(robot)) {
    reasons.push(`Low battery (${robot.battery.toFixed(0)}%)`);
  }
  return reasons.length > 0 ? reasons.join(' · ') : null;
}
