/**
 * Turns untrusted source records into validated FleetEvents.
 *
 * Both producers (the recorded log and the live simulator) go through here, so
 * malformed-input handling is written once. A bad field fails the whole event
 * rather than silently poisoning fleet state with NaN or an unknown status.
 */

import { ROBOT_STATUSES, type FleetEvent, type RawEvent, type RobotStatus, type TaskEvent } from '../types/fleet';
import { SITE } from './config';

const STATUS_SET = new Set<string>(ROBOT_STATUSES);
const TASK_EVENTS = new Set<TaskEvent>(['task_started', 'task_completed']);

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Clamp a coordinate into the site image so a marker can never render off-map. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface ParseResult {
  event: FleetEvent | null;
  /** Populated when the record was rejected; used for the console warning + tests. */
  error?: string;
}

export function parseEvent(raw: RawEvent, source: FleetEvent['source']): ParseResult {
  if (raw == null || typeof raw !== 'object') {
    return { event: null, error: 'record is not an object' };
  }

  if (!isFiniteNumber(raw.t) || raw.t < 0) {
    return { event: null, error: `invalid t: ${String(raw.t)}` };
  }
  if (typeof raw.robot_id !== 'string' || raw.robot_id.length === 0) {
    return { event: null, error: `invalid robot_id: ${String(raw.robot_id)}` };
  }
  if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
    return { event: null, error: `invalid coordinates for ${raw.robot_id}` };
  }
  if (typeof raw.status !== 'string' || !STATUS_SET.has(raw.status)) {
    return { event: null, error: `unknown status "${String(raw.status)}" for ${raw.robot_id}` };
  }
  if (!isFiniteNumber(raw.battery)) {
    return { event: null, error: `invalid battery for ${raw.robot_id}` };
  }

  const taskEvent =
    typeof raw.task_event === 'string' && TASK_EVENTS.has(raw.task_event as TaskEvent)
      ? (raw.task_event as TaskEvent)
      : undefined;

  const event: FleetEvent = {
    t: raw.t,
    robotId: raw.robot_id,
    x: clamp(raw.x, 0, SITE.width),
    y: clamp(raw.y, 0, SITE.height),
    status: raw.status as RobotStatus,
    battery: clamp(raw.battery, 0, 100),
    source,
    ...(taskEvent ? { taskEvent } : {}),
  };
  return { event };
}

/**
 * Parse a JSONL blob (the recorded log). Invalid lines are skipped with a
 * single grouped warning rather than crashing the load.
 */
export function parseEventLog(jsonl: string, source: FleetEvent['source'] = 'replay'): FleetEvent[] {
  const events: FleetEvent[] = [];
  const errors: string[] = [];

  for (const line of jsonl.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let raw: RawEvent;
    try {
      raw = JSON.parse(trimmed) as RawEvent;
    } catch {
      errors.push(`unparseable line: ${trimmed.slice(0, 80)}`);
      continue;
    }

    const { event, error } = parseEvent(raw, source);
    if (event) events.push(event);
    else if (error) errors.push(error);
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[eventParser] skipped ${errors.length} malformed event(s):`, errors.slice(0, 5));
  }

  // The recorded file is already ordered, but sort defensively so the replay
  // clock can rely on ascending `t`.
  events.sort((a, b) => a.t - b.t);
  return events;
}
