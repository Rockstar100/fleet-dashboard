import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReplay } from '../hooks/useReplay';
import { useLiveFeed } from '../hooks/useLiveFeed';
import type { FleetEvent, RobotState } from '../types/fleet';

/**
 * These simulate the exact race the audit asked for: a callback that was
 * already scheduled (rAF frame / interval tick) fires *after* the mode has
 * switched away, and — worse — the browser's own cancellation didn't land in
 * time. `cancelAnimationFrame`/`clearInterval` are stubbed to do nothing, so
 * the only thing that can stop a stale dispatch is the hook's own `enabledRef`
 * guard. If that guard is ever removed, these tests fail.
 */

function evt(t: number, robotId = 'r1'): FleetEvent {
  return { t, robotId, x: 0, y: 0, status: 'idle', battery: 50, source: 'replay' };
}

function robot(): RobotState {
  return { robotId: 'r1', robotType: 'picker', x: 0, y: 0, status: 'idle', battery: 50, lastEventT: 0, lastSeenWallMs: 0, updates: 0 };
}

describe('mode-switch race: stale replay frame after switching to live', () => {
  let rafCallbacks: FrameRequestCallback[];
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return ++rafId;
    }) as unknown as typeof requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', (() => {}) as unknown as typeof cancelAnimationFrame);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('refuses to dispatch a rAF callback scheduled before disable, once disabled', () => {
    const dispatch = vi.fn();
    const onRestart = vi.fn();
    const events = [evt(0), evt(5)];

    const { rerender } = renderHook(
      ({ enabled }) => useReplay(dispatch, { events, enabled, onRestart }),
      { initialProps: { enabled: true } },
    );

    expect(rafCallbacks.length).toBe(1);
    const staleFrame = rafCallbacks[0]!;

    // Switch away from replay. In a real browser cancelAnimationFrame would
    // normally prevent `staleFrame` from ever running; here it's stubbed to
    // do nothing so we can prove the hook doesn't rely on that alone.
    rerender({ enabled: false });
    dispatch.mockClear();

    staleFrame(1000);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('mode-switch race: stale live tick after switching to replay', () => {
  let intervalCallbacks: Array<() => void>;

  beforeEach(() => {
    intervalCallbacks = [];
    vi.stubGlobal('setInterval', ((cb: () => void) => {
      intervalCallbacks.push(cb);
      return intervalCallbacks.length;
    }) as unknown as typeof setInterval);
    vi.stubGlobal('clearInterval', (() => {}) as unknown as typeof clearInterval);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('refuses to dispatch an interval tick scheduled before disable, once disabled', () => {
    const dispatch = vi.fn();
    const getSeed = () => [robot()];

    const { rerender } = renderHook(
      ({ enabled }) => useLiveFeed(dispatch, { enabled, getSeed }),
      { initialProps: { enabled: true } },
    );

    // The hook ticks once immediately on enable, then registers the interval.
    expect(intervalCallbacks.length).toBe(1);
    const staleTick = intervalCallbacks[0]!;

    rerender({ enabled: false });
    dispatch.mockClear();

    staleTick();

    expect(dispatch).not.toHaveBeenCalled();
  });
});
