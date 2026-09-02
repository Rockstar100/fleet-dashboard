/**
 * Presentation for statuses and operational classes: colours + labels.
 * Kept apart from statusClassification.ts, which owns *meaning* (working vs
 * attention). This file owns *appearance* only.
 */

import type { OperationalClass } from './statusClassification';
import type { RobotStatus } from '../types/fleet';

export interface StatusVisual {
  label: string;
  /** Marker fill / legend swatch. */
  color: string;
  /** Tailwind text colour for chips on dark surfaces. */
  textClass: string;
  dotClass: string;
}

export const STATUS_VISUALS: Record<RobotStatus, StatusVisual> = {
  idle: { label: 'Idle', color: '#64748b', textClass: 'text-slate-300', dotClass: 'bg-slate-400' },
  active: { label: 'Active', color: '#38bdf8', textClass: 'text-sky-300', dotClass: 'bg-sky-400' },
  on_mission: { label: 'On mission', color: '#34d399', textClass: 'text-emerald-300', dotClass: 'bg-emerald-400' },
  charging: { label: 'Charging', color: '#a78bfa', textClass: 'text-violet-300', dotClass: 'bg-violet-400' },
  blocked: { label: 'Blocked', color: '#fbbf24', textClass: 'text-amber-300', dotClass: 'bg-amber-400' },
  error: { label: 'Error', color: '#f87171', textClass: 'text-red-300', dotClass: 'bg-red-400' },
  maintenance: { label: 'Maintenance', color: '#fb923c', textClass: 'text-orange-300', dotClass: 'bg-orange-400' },
  offline: { label: 'Offline', color: '#6b7280', textClass: 'text-gray-400', dotClass: 'bg-gray-500' },
};

export const CLASS_VISUALS: Record<OperationalClass, { label: string; color: string; textClass: string }> = {
  working: { label: 'Working', color: '#34d399', textClass: 'text-emerald-300' },
  healthy: { label: 'Healthy', color: '#64748b', textClass: 'text-slate-300' },
  attention: { label: 'Needs attention', color: '#f87171', textClass: 'text-red-300' },
};

export function statusVisual(status: RobotStatus): StatusVisual {
  return STATUS_VISUALS[status];
}
