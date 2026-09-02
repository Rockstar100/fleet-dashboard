import { describe, expect, it } from 'vitest';
import { bucketByTime, eventsInWindow, progress } from '../lib/replayClock';
import type { FleetEvent } from '../types/fleet';

const mk = (t: number, robotId: string): FleetEvent => ({
  t,
  robotId,
  x: 0,
  y: 0,
  status: 'idle',
  battery: 50,
  source: 'replay',
});

const events = [mk(0, 'r1'), mk(0, 'r2'), mk(5, 'r1'), mk(5, 'r2'), mk(10, 'r1')];

describe('replayClock', () => {
  it('buckets events by distinct t', () => {
    const buckets = bucketByTime(events);
    expect(buckets.map((b) => b.t)).toEqual([0, 5, 10]);
    expect(buckets[0]!.events).toHaveLength(2);
  });

  it('emits events in the half-open window (from, to]', () => {
    const buckets = bucketByTime(events);
    // First advance from -1 -> 0 picks up the t=0 bucket.
    expect(eventsInWindow(buckets, -1, 0)).toHaveLength(2);
    // Advancing 0 -> 4 picks up nothing (t=0 already consumed, t=5 not yet).
    expect(eventsInWindow(buckets, 0, 4)).toHaveLength(0);
    // 4 -> 10 picks up the t=5 and t=10 buckets.
    expect(eventsInWindow(buckets, 4, 10)).toHaveLength(3);
  });

  it('never re-emits a bucket when the clock does not advance', () => {
    const buckets = bucketByTime(events);
    expect(eventsInWindow(buckets, 5, 5)).toHaveLength(0);
  });

  it('progress is clamped to 0..1', () => {
    expect(progress(-10, 900)).toBe(0);
    expect(progress(450, 900)).toBe(0.5);
    expect(progress(2000, 900)).toBe(1);
  });
});
