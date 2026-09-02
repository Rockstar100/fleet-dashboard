/**
 * The reducer that turns a stream of FleetEvents into fleet state.
 *
 * Design rules:
 *   - Pure. No timers, no I/O. Given the same (state, action) it always returns
 *     the same result — which is what makes it easy to test.
 *   - Last-write-wins per robot, keyed on event `t`. An event whose `t` is older
 *     than what we already have for that robot is dropped. This is the entire
 *     out-of-order / duplicate story: a late or replayed packet can't rewind a
 *     robot to a stale position.
 *   - Unknown robot ids are accepted (the roster could grow); `robotType` falls
 *     back to 'unknown' until robots.json says otherwise.
 *
 * Replay and live mode both dispatch `apply` with the same event shape, so there
 * is exactly one code path that mutates fleet state.
 */

import type { FleetEvent, FleetState, RobotSpec, RobotState } from '../types/fleet';

export type FleetAction =
  | { type: 'apply'; events: FleetEvent[]; nowMs?: number }
  | { type: 'reset'; roster?: RobotSpec[] }
  /**
   * Restart the timeline but keep robots where they currently are on the map.
   * Used when switching replay <-> live: `lastEventT` is rewound to -1 so the
   * next source's `t` sequence (which starts near 0) isn't rejected as stale.
   */
  | { type: 'rebase'; from: FleetState };

/** Build the zero state: robots at their roster start positions, no telemetry yet. */
export function initFleetState(roster: RobotSpec[] = []): FleetState {
  const robots: Record<string, RobotState> = {};
  for (const spec of roster) {
    robots[spec.robot_id] = {
      robotId: spec.robot_id,
      robotType: spec.robot_type,
      x: spec.start.x,
      y: spec.start.y,
      status: 'idle',
      battery: 100,
      lastEventT: -1,
      lastSeenWallMs: 0,
      updates: 0,
    };
  }
  return { robots, clockT: 0 };
}

function applyEvent(state: FleetState, event: FleetEvent, nowMs: number): FleetState {
  const prev = state.robots[event.robotId];

  // Drop stale / duplicate events: never let an older `t` overwrite newer data.
  if (prev && event.t < prev.lastEventT) {
    return state;
  }

  const next: RobotState = {
    robotId: event.robotId,
    robotType: prev?.robotType ?? 'unknown',
    x: event.x,
    y: event.y,
    status: event.status,
    battery: event.battery,
    lastEventT: event.t,
    lastSeenWallMs: nowMs,
    updates: (prev?.updates ?? 0) + 1,
    lastTaskEvent: event.taskEvent ?? prev?.lastTaskEvent,
  };

  return {
    robots: { ...state.robots, [event.robotId]: next },
    clockT: Math.max(state.clockT, event.t),
  };
}

export function fleetReducer(state: FleetState, action: FleetAction): FleetState {
  switch (action.type) {
    case 'reset':
      return initFleetState(action.roster);
    case 'rebase': {
      const robots: Record<string, RobotState> = {};
      for (const robot of Object.values(action.from.robots)) {
        robots[robot.robotId] = { ...robot, lastEventT: -1, updates: 0 };
      }
      return { robots, clockT: 0 };
    }
    case 'apply': {
      const nowMs = action.nowMs ?? Date.now();
      let nextState = state;
      for (const event of action.events) {
        nextState = applyEvent(nextState, event, nowMs);
      }
      return nextState;
    }
    default:
      return state;
  }
}
