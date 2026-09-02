/**
 * Replay timing, as pure functions so the tricky "which events fire this frame"
 * logic can be tested without a running clock.
 *
 * The React hook (useReplay) owns the actual requestAnimationFrame loop and the
 * virtual-time accumulator; it just asks this module what to emit.
 */

import type { FleetEvent } from '../types/fleet';

export interface EventBucket {
  t: number;
  events: FleetEvent[];
}

/** Group a sorted event list into one bucket per distinct `t`. */
export function bucketByTime(events: FleetEvent[]): EventBucket[] {
  const buckets: EventBucket[] = [];
  let current: EventBucket | null = null;
  for (const event of events) {
    if (!current || current.t !== event.t) {
      current = { t: event.t, events: [event] };
      buckets.push(current);
    } else {
      current.events.push(event);
    }
  }
  return buckets;
}

/**
 * Return every event whose `t` lies in the half-open interval (fromT, toT].
 * `fromT` is exclusive so advancing the clock never replays a bucket twice;
 * `toT` is inclusive so a bucket exactly at the new time fires now.
 */
export function eventsInWindow(buckets: EventBucket[], fromT: number, toT: number): FleetEvent[] {
  if (toT <= fromT) return [];
  const out: FleetEvent[] = [];
  for (const bucket of buckets) {
    if (bucket.t > fromT && bucket.t <= toT) {
      out.push(...bucket.events);
    } else if (bucket.t > toT) {
      break; // buckets are sorted; nothing further can match
    }
  }
  return out;
}

/** Fraction 0..1 of the recorded window that has been played. */
export function progress(currentT: number, windowSeconds: number): number {
  if (windowSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, currentT / windowSeconds));
}
