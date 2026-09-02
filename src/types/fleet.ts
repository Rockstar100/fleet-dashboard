/**
 * Core domain types for the fleet dashboard.
 *
 * The whole app is built around three shapes:
 *   - RawEvent    : a line as it arrives from a source (recorded file or live sim), untrusted.
 *   - FleetEvent  : a validated, normalised event ready to apply to state.
 *   - FleetState  : the single source of truth the UI renders from.
 */

export const ROBOT_STATUSES = [
  'idle',
  'active',
  'on_mission',
  'charging',
  'blocked',
  'error',
  'maintenance',
  'offline',
] as const;

export type RobotStatus = (typeof ROBOT_STATUSES)[number];

export type RobotId = string;

export type RobotType = 'picker' | 'hauler' | string;

/** Static roster entry from robots.json. */
export interface RobotSpec {
  robot_id: RobotId;
  robot_type: RobotType;
  start: { x: number; y: number };
}

/** A line straight from a source. Every field is treated as unknown until parsed. */
export interface RawEvent {
  t?: unknown;
  robot_id?: unknown;
  x?: unknown;
  y?: unknown;
  status?: unknown;
  battery?: unknown;
  task_event?: unknown;
}

export type TaskEvent = 'task_started' | 'task_completed';

/** A validated event. `t` is seconds from the start of the observed window. */
export interface FleetEvent {
  t: number;
  robotId: RobotId;
  x: number;
  y: number;
  status: RobotStatus;
  battery: number;
  taskEvent?: TaskEvent;
  /** Where this event came from — useful for debugging and for the feed indicator. */
  source: 'replay' | 'live';
}

/** Current known state for one robot. */
export interface RobotState {
  robotId: RobotId;
  robotType: RobotType;
  x: number;
  y: number;
  status: RobotStatus;
  battery: number;
  /** `t` of the most recent event applied to this robot. */
  lastEventT: number;
  /** Wall-clock ms when we last received anything for this robot (stale detection). */
  lastSeenWallMs: number;
  /** Number of events applied — handy in tests and the detail panel. */
  updates: number;
  lastTaskEvent?: TaskEvent;
}

export interface FleetState {
  robots: Record<RobotId, RobotState>;
  /** Highest `t` seen across the whole fleet — drives the replay clock read-out. */
  clockT: number;
}

export type FleetMode = 'replay' | 'live';

/** One accumulated point on the fleet-level trend chart. */
export interface FleetSample {
  /** Seconds into the observed window. */
  t: number;
  working: number;
  attention: number;
  healthy: number;
  avgBattery: number;
}
