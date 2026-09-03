import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFleetMetrics } from '../hooks/useFleetMetrics';
import { fleetReducer, initFleetState } from '../lib/fleetReducer';
import type { FleetEvent, RobotSpec } from '../types/fleet';

const roster: RobotSpec[] = ['r1', 'r2'].map((id) => ({
  robot_id: id,
  robot_type: 'picker',
  start: { x: 0, y: 0 },
}));

const evt = (over: Partial<FleetEvent>): FleetEvent => ({
  t: 5,
  robotId: 'r1',
  x: 0,
  y: 0,
  status: 'idle',
  battery: 50,
  source: 'replay',
  ...over,
});

describe('useFleetMetrics', () => {
  it('samples once per dispatch batch, reflecting every robot in that batch (not a partial fleet)', () => {
    let state = initFleetState(roster);
    const { result, rerender } = renderHook(({ s }) => useFleetMetrics(s, 'replay:0'), {
      initialProps: { s: state },
    });
    // Mount anchors one sample at the pre-telemetry state (t=0, both robots idle).
    expect(result.current.series).toHaveLength(1);
    expect(result.current.series[0]).toMatchObject({ working: 0, healthy: 2 });

    // One batch updates both robots to 'active' in a single dispatch — the
    // trend hook must never observe an intermediate state where only one of
    // them has been updated, only the fully-applied result.
    state = fleetReducer(state, {
      type: 'apply',
      nowMs: 1,
      events: [evt({ robotId: 'r1', status: 'active' }), evt({ robotId: 'r2', status: 'active' })],
    });
    rerender({ s: state });

    expect(result.current.series).toHaveLength(2);
    expect(result.current.series[1]).toMatchObject({ working: 2, healthy: 0 });
  });

  it('clears the series when resetKey changes (mode switch / replay restart)', () => {
    let state = initFleetState(roster);
    const { result, rerender } = renderHook(({ s, key }) => useFleetMetrics(s, key), {
      initialProps: { s: state, key: 'replay:0' },
    });

    state = fleetReducer(state, { type: 'apply', nowMs: 1, events: [evt({ t: 10 })] });
    rerender({ s: state, key: 'replay:0' });
    expect(result.current.series.length).toBeGreaterThan(0);

    // Switching mode (or restarting) bumps the epoch baked into resetKey.
    rerender({ s: state, key: 'live:1' });
    expect(result.current.series).toHaveLength(0);
  });
});
