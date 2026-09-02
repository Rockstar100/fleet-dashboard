import { describe, expect, it } from 'vitest';
import { createLiveSimulator } from '../lib/liveSimulator';
import { parseEvent } from '../lib/eventParser';
import { SITE } from '../lib/config';
import { ROBOT_STATUSES, type RobotState } from '../types/fleet';

function seed(): RobotState[] {
  return [
    { robotId: 'r1', robotType: 'picker', x: 100, y: 100, status: 'active', battery: 60, lastEventT: 0, lastSeenWallMs: 0, updates: 0 },
    { robotId: 'r2', robotType: 'hauler', x: 700, y: 400, status: 'idle', battery: 18, lastEventT: 0, lastSeenWallMs: 0, updates: 0 },
  ];
}

// A tiny deterministic PRNG so the test is reproducible.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('liveSimulator', () => {
  it('emits one valid event per robot per tick', () => {
    const sim = createLiveSimulator(seed(), mulberry32(1));
    const batch = sim.tick();
    expect(batch).toHaveLength(2);
    for (const raw of batch) {
      const { event } = parseEvent(raw, 'live');
      expect(event).not.toBeNull();
    }
  });

  it('keeps positions inside the site and battery/status valid over a long run', () => {
    const sim = createLiveSimulator(seed(), mulberry32(42));
    for (let i = 0; i < 500; i += 1) {
      for (const raw of sim.tick()) {
        expect(raw.x as number).toBeGreaterThanOrEqual(0);
        expect(raw.x as number).toBeLessThanOrEqual(SITE.width);
        expect(raw.y as number).toBeGreaterThanOrEqual(0);
        expect(raw.y as number).toBeLessThanOrEqual(SITE.height);
        expect(raw.battery as number).toBeGreaterThanOrEqual(0);
        expect(raw.battery as number).toBeLessThanOrEqual(100);
        expect(ROBOT_STATUSES).toContain(raw.status);
      }
    }
  });

  it('advances synthetic time so the trend axis keeps moving', () => {
    const sim = createLiveSimulator(seed(), mulberry32(7));
    sim.tick();
    sim.tick();
    expect(sim.elapsedSeconds).toBeGreaterThan(0);
  });

  it('routes a low-battery robot toward charging within a few ticks', () => {
    const sim = createLiveSimulator(seed(), mulberry32(3));
    let sawCharging = false;
    for (let i = 0; i < 20 && !sawCharging; i += 1) {
      sawCharging = sim.tick().some((e) => e.robot_id === 'r2' && e.status === 'charging');
    }
    expect(sawCharging).toBe(true);
  });
});
