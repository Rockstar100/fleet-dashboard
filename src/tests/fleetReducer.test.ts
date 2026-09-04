import { describe, expect, it } from 'vitest';
import { fleetReducer, initFleetState } from '../lib/fleetReducer';
import type { FleetEvent, RobotSpec } from '../types/fleet';

const roster: RobotSpec[] = [{ robot_id: 'r1', robot_type: 'picker', start: { x: 10, y: 20 } }];

function evt(over: Partial<FleetEvent>): FleetEvent {
  return {
    t: 0,
    robotId: 'r1',
    x: 0,
    y: 0,
    status: 'idle',
    battery: 100,
    source: 'replay',
    ...over,
  };
}

describe('fleetReducer', () => {
  it('applies an event as the robot latest state', () => {
    const state = fleetReducer(initFleetState(roster), {
      type: 'apply',
      events: [evt({ t: 5, x: 100, y: 200, status: 'active', battery: 90 })],
      nowMs: 1_000,
    });
    expect(state.robots.r1).toMatchObject({ x: 100, y: 200, status: 'active', battery: 90, lastEventT: 5, updates: 1 });
    expect(state.clockT).toBe(5);
  });

  it('ignores an out-of-order / duplicate event with an older t', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, { type: 'apply', events: [evt({ t: 20, x: 5, status: 'on_mission' })], nowMs: 1 });
    state = fleetReducer(state, { type: 'apply', events: [evt({ t: 10, x: 999, status: 'error' })], nowMs: 2 });
    // The stale event must not rewind the robot.
    expect(state.robots.r1!.x).toBe(5);
    expect(state.robots.r1!.status).toBe('on_mission');
    expect(state.robots.r1!.lastEventT).toBe(20);
  });

  it('resolves two same-timestamp events for one robot by array order (later wins)', () => {
    const state = fleetReducer(initFleetState(roster), {
      type: 'apply',
      events: [
        evt({ t: 30, x: 1, status: 'active' }),
        evt({ t: 30, x: 2, status: 'blocked' }),
      ],
      nowMs: 1,
    });
    // Both share t=30; the second one in the batch is the deterministic winner.
    expect(state.robots.r1).toMatchObject({ x: 2, status: 'blocked', lastEventT: 30, updates: 2 });
  });

  it('does not let one robot update mutate another robot in the same batch', () => {
    const twoRobotRoster: RobotSpec[] = [
      { robot_id: 'r1', robot_type: 'picker', start: { x: 0, y: 0 } },
      { robot_id: 'r2', robot_type: 'hauler', start: { x: 0, y: 0 } },
    ];
    const before = initFleetState(twoRobotRoster);
    const after = fleetReducer(before, {
      type: 'apply',
      events: [evt({ robotId: 'r1', t: 1, x: 500 })],
      nowMs: 1,
    });
    expect(after.robots.r1!.x).toBe(500);
    expect(after.robots.r2).toEqual(before.robots.r2);
    // The reducer must not mutate the previous state object either.
    expect(before.robots.r1!.x).toBe(0);
  });

  it('accepts an unknown robot id with a fallback type', () => {
    const state = fleetReducer(initFleetState(roster), {
      type: 'apply',
      events: [evt({ robotId: 'r99', t: 1 })],
    });
    expect(state.robots.r99).toBeDefined();
    expect(state.robots.r99!.robotType).toBe('unknown');
  });

  it('rebase keeps positions but rewinds the clock so a new source is not rejected', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, { type: 'apply', events: [evt({ t: 900, x: 42, status: 'charging' })], nowMs: 1 });
    state = fleetReducer(state, { type: 'rebase', from: state });
    expect(state.robots.r1!.x).toBe(42);
    expect(state.robots.r1!.lastEventT).toBe(-1);
    expect(state.clockT).toBe(0);

    // A fresh source starting near t=0 is now accepted.
    state = fleetReducer(state, { type: 'apply', events: [evt({ t: 5, x: 7, status: 'active' })], nowMs: 2 });
    expect(state.robots.r1!.x).toBe(7);
  });

  it('remembers the last task_event across later events that omit it', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, {
      type: 'apply',
      events: [evt({ t: 55, status: 'on_mission', taskEvent: 'task_completed' })],
      nowMs: 1,
    });
    expect(state.robots.r1!.lastTaskEvent).toBe('task_completed');

    state = fleetReducer(state, {
      type: 'apply',
      events: [evt({ t: 60, status: 'idle', battery: 40 })],
      nowMs: 2,
    });
    expect(state.robots.r1!.lastTaskEvent).toBe('task_completed');
  });
});
