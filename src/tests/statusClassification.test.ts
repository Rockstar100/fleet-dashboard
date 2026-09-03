import { describe, expect, it } from 'vitest';
import { attentionReason, classify, needsAttention } from '../lib/statusClassification';
import { ATTENTION } from '../lib/config';
import type { RobotState } from '../types/fleet';

function robot(over: Partial<RobotState>): RobotState {
  return {
    robotId: 'r1',
    robotType: 'picker',
    x: 0,
    y: 0,
    status: 'idle',
    battery: 80,
    lastEventT: 0,
    lastSeenWallMs: 1_000,
    updates: 1,
    ...over,
  };
}

describe('status classification', () => {
  it('treats active and on_mission as working', () => {
    expect(classify(robot({ status: 'active' }))).toBe('working');
    expect(classify(robot({ status: 'on_mission' }))).toBe('working');
  });

  it('treats idle and charging as healthy', () => {
    expect(classify(robot({ status: 'idle' }))).toBe('healthy');
    expect(classify(robot({ status: 'charging', battery: 5 }))).toBe('healthy');
  });

  it.each(['blocked', 'error', 'maintenance', 'offline'] as const)('flags %s as attention', (status) => {
    expect(classify(robot({ status }))).toBe('attention');
    expect(needsAttention(robot({ status }))).toBe(true);
  });

  it('flags low battery while not charging, but not while charging', () => {
    expect(needsAttention(robot({ status: 'active', battery: ATTENTION.lowBatteryPct - 1 }))).toBe(true);
    expect(needsAttention(robot({ status: 'charging', battery: 3 }))).toBe(false);
  });

  it('flags a robot that has gone stale', () => {
    const now = 100_000;
    const fresh = robot({ lastSeenWallMs: now - 1_000 });
    const stale = robot({ lastSeenWallMs: now - ATTENTION.staleAfterMs - 1 });
    expect(needsAttention(fresh, { nowMs: now })).toBe(false);
    expect(needsAttention(stale, { nowMs: now })).toBe(true);
  });

  it('produces a readable reason string, and null when healthy', () => {
    expect(attentionReason(robot({ status: 'idle', battery: 80 }))).toBeNull();
    expect(attentionReason(robot({ status: 'error', battery: 10 }))).toMatch(/error/i);
    expect(attentionReason(robot({ status: 'active', battery: 8 }))).toMatch(/low battery/i);
  });

  it('treats the low-battery threshold as inclusive: 20 needs attention, 20.1 does not', () => {
    expect(needsAttention(robot({ status: 'active', battery: ATTENTION.lowBatteryPct }))).toBe(true);
    expect(needsAttention(robot({ status: 'active', battery: ATTENTION.lowBatteryPct + 0.1 }))).toBe(false);
  });

  it('orders combined attention reasons deterministically: explicit fault, then stale, then battery', () => {
    const now = 100_000;
    const troubled = robot({
      status: 'error',
      battery: 5,
      lastSeenWallMs: now - ATTENTION.staleAfterMs - 1,
    });
    const reason = attentionReason(troubled, { nowMs: now });
    expect(reason).not.toBeNull();
    const errorIdx = reason!.indexOf('error');
    const staleIdx = reason!.indexOf('stale');
    const batteryIdx = reason!.indexOf('Low battery');
    expect(errorIdx).toBeGreaterThanOrEqual(0);
    expect(staleIdx).toBeGreaterThan(errorIdx);
    expect(batteryIdx).toBeGreaterThan(staleIdx);
  });
});
