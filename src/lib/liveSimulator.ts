/**
 * Simulated live feed.
 *
 * This is NOT a re-run of events.jsonl. It seeds itself from the last known fleet
 * state (so the map doesn't jump when you switch to Live) and then generates
 * fresh, plausible telemetry:
 *
 *   movement  — each robot carries a heading; it walks forward a bounded step
 *               each tick and slowly turns. It reflects off the site edges so
 *               positions stay inside layout.png.
 *   battery   — drains while working/blocked/error, charges while `charging`,
 *               trickles down otherwise. Clamped to 0..100.
 *   status    — a small transition table. Normal robots wander idle<->active<->
 *               on_mission with occasional faults; a robot at/under the low
 *               battery threshold heads to `charging` and climbs back out.
 *
 * Rate: one update per robot per tick. With config LIVE.tickMs = 1000ms and 8
 * robots that's ~8 events/second. `secondsPerTick` advances the synthetic `t`
 * so the trend chart keeps scrolling.
 *
 * An injectable RNG keeps the generator deterministic in tests.
 */

import { LIVE, SITE, ATTENTION } from './config';
import type { RawEvent, RobotState, RobotStatus } from '../types/fleet';

export type Rng = () => number;

interface SimRobot {
  robotId: string;
  x: number;
  y: number;
  headingRad: number;
  status: RobotStatus;
  battery: number;
}

const NORMAL_STATUSES: RobotStatus[] = ['idle', 'active', 'on_mission'];
const FAULT_STATUSES: RobotStatus[] = ['blocked', 'error', 'maintenance'];

/** Statuses in which the robot is physically moving. */
function isMobile(status: RobotStatus): boolean {
  return status === 'active' || status === 'on_mission';
}

function batteryDelta(status: RobotStatus): number {
  if (status === 'charging') return LIVE.batteryChargePerTick;
  if (status === 'offline' || status === 'maintenance') return 0;
  if (status === 'blocked' || status === 'error') return LIVE.batteryDrainPerTick * 0.6;
  if (isMobile(status)) return -LIVE.batteryDrainPerTick;
  return -LIVE.batteryDrainPerTick * 0.15; // idle self-discharge
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

/**
 * Decide the next status. Battery pressure dominates; otherwise mostly hold,
 * sometimes drift within the normal set, rarely fault or recover.
 *
 * `offline` is checked first and exempted from the low-battery routing below
 * it: `offline` means the robot isn't reporting/deciding anything (that's the
 * whole point of the status), so it can't "choose" to head for a charger
 * while offline. It has to come back online (recover to `idle`) first, same
 * as any other tick — only once it's no longer `offline` can low battery
 * redirect it. A `blocked`/`error`/`maintenance` robot, by contrast, is still
 * a reporting, reasoning robot, so a fail-safe "go charge anyway" override is
 * plausible for those and is left in the low-battery branch below.
 */
function nextStatus(robot: SimRobot, rng: Rng): RobotStatus {
  const roll = rng();

  if (robot.status === 'offline') {
    return roll < 0.3 ? 'idle' : 'offline';
  }
  if (robot.battery <= ATTENTION.lowBatteryPct && robot.status !== 'charging') {
    return roll < 0.85 ? 'charging' : robot.status;
  }
  if (robot.status === 'charging') {
    return robot.battery >= 80 ? 'idle' : 'charging';
  }
  if (FAULT_STATUSES.includes(robot.status)) {
    return roll < 0.4 ? 'idle' : robot.status; // recover
  }

  // Normal operation.
  if (roll < 0.08) return pick(rng, FAULT_STATUSES);
  if (roll < 0.1) return 'offline';
  if (roll < 0.45) return pick(rng, NORMAL_STATUSES);
  return robot.status;
}

function step(robot: SimRobot, rng: Rng): void {
  robot.battery = clamp(robot.battery + batteryDelta(robot.status), 0, 100);
  robot.status = nextStatus(robot, rng);

  if (!isMobile(robot.status)) return;

  // Wander: nudge heading, advance, reflect off edges.
  robot.headingRad += (rng() - 0.5) * 0.9;
  const speed = LIVE.maxStepUnits * (0.35 + rng() * 0.65);
  let nx = robot.x + Math.cos(robot.headingRad) * speed;
  let ny = robot.y + Math.sin(robot.headingRad) * speed;

  const margin = LIVE.edgeMarginUnits;
  if (nx < margin || nx > SITE.width - margin) {
    robot.headingRad = Math.PI - robot.headingRad;
    nx = clamp(nx, margin, SITE.width - margin);
  }
  if (ny < margin || ny > SITE.height - margin) {
    robot.headingRad = -robot.headingRad;
    ny = clamp(ny, margin, SITE.height - margin);
  }
  robot.x = nx;
  robot.y = ny;
}

export interface LiveSimulator {
  /** Advance the model one tick and return one RawEvent per robot. */
  tick(): RawEvent[];
  /** Synthetic seconds elapsed since the simulator started. */
  readonly elapsedSeconds: number;
}

export function createLiveSimulator(seed: RobotState[], rng: Rng = Math.random): LiveSimulator {
  const robots: SimRobot[] = seed.map((r) => ({
    robotId: r.robotId,
    x: r.x,
    y: r.y,
    headingRad: rng() * Math.PI * 2,
    status: r.status,
    battery: r.battery,
  }));

  let elapsed = 0;

  return {
    get elapsedSeconds() {
      return elapsed;
    },
    tick(): RawEvent[] {
      elapsed += LIVE.secondsPerTick;
      return robots.map((robot) => {
        step(robot, rng);
        return {
          t: elapsed,
          robot_id: robot.robotId,
          x: Math.round(robot.x * 10) / 10,
          y: Math.round(robot.y * 10) / 10,
          status: robot.status,
          battery: Math.round(robot.battery * 10) / 10,
        };
      });
    },
  };
}
