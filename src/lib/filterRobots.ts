/** Pure robot-list filtering, shared by the list and the map dimming. */

import { needsAttention } from './statusClassification';
import type { RobotState, RobotStatus } from '../types/fleet';

export interface RobotFilters {
  query: string;
  status: RobotStatus | 'all';
  attentionOnly: boolean;
}

export const EMPTY_FILTERS: RobotFilters = { query: '', status: 'all', attentionOnly: false };

export function filterRobots(robots: RobotState[], filters: RobotFilters, nowMs?: number): RobotState[] {
  const q = filters.query.trim().toLowerCase();
  return robots.filter((robot) => {
    if (q && !robot.robotId.toLowerCase().includes(q) && !robot.robotType.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.status !== 'all' && robot.status !== filters.status) return false;
    if (filters.attentionOnly && !needsAttention(robot, { nowMs })) return false;
    return true;
  });
}

/** Stable sort for the list: attention first, then lowest battery, then id. */
export function sortRobotsForList(robots: RobotState[], nowMs?: number): RobotState[] {
  return [...robots].sort((a, b) => {
    const aAtt = needsAttention(a, { nowMs }) ? 0 : 1;
    const bAtt = needsAttention(b, { nowMs }) ? 0 : 1;
    if (aAtt !== bAtt) return aAtt - bAtt;
    if (a.battery !== b.battery) return a.battery - b.battery;
    return a.robotId.localeCompare(b.robotId, undefined, { numeric: true });
  });
}
