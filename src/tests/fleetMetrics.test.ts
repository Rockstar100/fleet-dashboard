import { describe, expect, it } from 'vitest';
import { pushSample, summarise, toSample } from '../lib/fleetMetrics';
import { fleetReducer, initFleetState } from '../lib/fleetReducer';
import { TREND_MAX_SAMPLES } from '../lib/config';
import type { FleetEvent, FleetSample, RobotSpec } from '../types/fleet';

const roster: RobotSpec[] = ['r1', 'r2', 'r3'].map((id) => ({
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

describe('fleetMetrics', () => {
  it('summarises working / attention / healthy counts and average battery', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, {
      type: 'apply',
      nowMs: 1_000,
      events: [
        evt({ robotId: 'r1', status: 'on_mission', battery: 90 }),
        evt({ robotId: 'r2', status: 'error', battery: 60 }),
        evt({ robotId: 'r3', status: 'idle', battery: 30 }),
      ],
    });
    const s = summarise(state, 1_000);
    expect(s).toMatchObject({ total: 3, working: 1, attention: 1, healthy: 1 });
    expect(s.avgBattery).toBeCloseTo(60);
  });

  it('pushSample de-dupes on t and caps the series length', () => {
    let series: FleetSample[] = [];
    series = pushSample(series, { t: 0, working: 1, attention: 0, healthy: 2, avgBattery: 50 });
    series = pushSample(series, { t: 0, working: 3, attention: 0, healthy: 0, avgBattery: 55 });
    expect(series).toHaveLength(1);
    expect(series[0]!.working).toBe(3);

    for (let t = 1; t <= TREND_MAX_SAMPLES + 50; t += 1) {
      series = pushSample(series, { t, working: 0, attention: 0, healthy: 3, avgBattery: 50 });
    }
    expect(series.length).toBe(TREND_MAX_SAMPLES);
    expect(series[series.length - 1]!.t).toBe(TREND_MAX_SAMPLES + 50);
  });

  it('toSample stamps the current clock time', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, { type: 'apply', events: [evt({ t: 120 })], nowMs: 1 });
    expect(toSample(state).t).toBe(120);
  });
});
