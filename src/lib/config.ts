/**
 * Every tunable number in one place. If a reviewer wants to change playback
 * behaviour, the site bounds, or the live-feed cadence, they change it here and
 * nowhere else.
 */

/** Native pixel size of layout.png. Robot coordinates are in this same space. */
export const SITE = {
  width: 900,
  height: 560,
} as const;

/** Recorded window: events.jsonl runs t = 0..900s, one frame every 5s. */
export const REPLAY = {
  windowSeconds: 900,
  /** Speed multipliers offered in the UI. */
  speeds: [1, 2, 5, 10, 20] as const,
  defaultSpeed: 5,
} as const;

/** Live simulation parameters. See liveSimulator.ts for how these are used. */
export const LIVE = {
  /** One update per robot every tick. 8 robots => ~8 events/sec at 1000ms. */
  tickMs: 1000,
  /** Virtual seconds added to `t` per tick, so the trend x-axis keeps advancing. */
  secondsPerTick: 5,
  /** Max distance (units) a robot moves per tick while active. */
  maxStepUnits: 14,
  /** Battery drain/charge per tick (percentage points). */
  batteryDrainPerTick: 0.25,
  batteryChargePerTick: 0.9,
  /** Keep robots this far from the image edge so markers never clip. */
  edgeMarginUnits: 8,
} as const;

/**
 * Attention thresholds. Which *statuses* need attention lives in
 * statusClassification.ts; this is just the battery rule.
 */
export const ATTENTION = {
  lowBatteryPct: 20,
  /** A robot silent for longer than this (wall clock) is flagged stale. */
  staleAfterMs: 15_000,
} as const;

/** Trend chart keeps at most this many samples (rolling window in live mode). */
export const TREND_MAX_SAMPLES = 240;
