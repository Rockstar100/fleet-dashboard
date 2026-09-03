import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, filterRobots, sortRobotsForList } from '../lib/filterRobots';
import type { RobotState } from '../types/fleet';

function robot(over: Partial<RobotState>): RobotState {
  return {
    robotId: 'r1',
    robotType: 'picker',
    x: 0,
    y: 0,
    status: 'idle',
    battery: 80,
    lastEventT: 0,
    lastSeenWallMs: 0,
    updates: 0,
    ...over,
  };
}

const roster: RobotState[] = [
  robot({ robotId: 'r1', robotType: 'picker', status: 'idle', battery: 90 }),
  robot({ robotId: 'r2', robotType: 'hauler', status: 'active', battery: 50 }),
  robot({ robotId: 'r10', robotType: 'hauler', status: 'error', battery: 10 }),
];

describe('filterRobots', () => {
  it('matches a partial, case-insensitive robot id', () => {
    expect(filterRobots(roster, { ...EMPTY_FILTERS, query: 'R1' }).map((r) => r.robotId)).toEqual(['r1', 'r10']);
  });

  it('matches a partial, case-insensitive robot type', () => {
    expect(filterRobots(roster, { ...EMPTY_FILTERS, query: 'HAUL' }).map((r) => r.robotId)).toEqual(['r2', 'r10']);
  });

  it('trims surrounding whitespace before matching', () => {
    expect(filterRobots(roster, { ...EMPTY_FILTERS, query: '  r2  ' }).map((r) => r.robotId)).toEqual(['r2']);
  });

  it('treats an empty (or all-whitespace) query as "match everything"', () => {
    expect(filterRobots(roster, { ...EMPTY_FILTERS, query: '' })).toHaveLength(3);
    expect(filterRobots(roster, { ...EMPTY_FILTERS, query: '   ' })).toHaveLength(3);
  });

  it('filters by exact status', () => {
    expect(filterRobots(roster, { ...EMPTY_FILTERS, status: 'active' }).map((r) => r.robotId)).toEqual(['r2']);
  });

  it('filters to attention-only', () => {
    expect(filterRobots(roster, { ...EMPTY_FILTERS, attentionOnly: true }).map((r) => r.robotId)).toEqual(['r10']);
  });

  it('combines filters with AND semantics, and can produce an empty result', () => {
    // r2 matches the query but is 'active', not 'error' — AND of both yields nothing.
    expect(filterRobots(roster, { query: 'r2', status: 'error', attentionOnly: false })).toHaveLength(0);
  });
});

describe('sortRobotsForList', () => {
  it('puts attention robots first, then the rest by ascending battery', () => {
    const shuffled = [roster[1]!, roster[2]!, roster[0]!]; // r2(active,50), r10(error,10), r1(idle,90)
    // r10 is the only attention robot -> first. Among the rest, r2 (50%) sorts
    // before r1 (90%) by ascending battery.
    expect(sortRobotsForList(shuffled).map((r) => r.robotId)).toEqual(['r10', 'r2', 'r1']);
  });

  it('breaks equal battery ties by numeric robot id, not input order', () => {
    const tied = [
      robot({ robotId: 'r10', battery: 50 }),
      robot({ robotId: 'r2', battery: 50 }),
      robot({ robotId: 'r1', battery: 50 }),
    ];
    // Numeric-aware compare: r1 < r2 < r10, not lexicographic ('r1' < 'r10' < 'r2').
    expect(sortRobotsForList(tied).map((r) => r.robotId)).toEqual(['r1', 'r2', 'r10']);
  });

  it('is deterministic: sorting twice from different input orders agrees', () => {
    const a = sortRobotsForList([roster[2]!, roster[0]!, roster[1]!]).map((r) => r.robotId);
    const b = sortRobotsForList([roster[1]!, roster[2]!, roster[0]!]).map((r) => r.robotId);
    expect(a).toEqual(b);
  });
});
