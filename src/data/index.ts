/**
 * Bundled challenge data. Both files are small (roster < 1KB, log ~126KB) so
 * shipping them in the bundle keeps the deployment a single static artifact with
 * no fetch/CORS/backend concerns.
 */

import rosterJson from './robots.json';
import eventLogRaw from './events.jsonl?raw';
import { parseEventLog } from '../lib/eventParser';
import type { FleetEvent, RobotSpec } from '../types/fleet';

export const roster: RobotSpec[] = rosterJson as RobotSpec[];

/** Parsed once at module load; the recorded replay stream. */
export const recordedEvents: FleetEvent[] = parseEventLog(eventLogRaw, 'replay');

export const siteMapUrl = new URL('./layout.png', import.meta.url).href;
