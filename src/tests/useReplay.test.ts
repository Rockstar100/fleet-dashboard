import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReplay } from '../hooks/useReplay';
import type { FleetEvent } from '../types/fleet';

function evt(t: number): FleetEvent {
  return { t, robotId: 'r1', x: 0, y: 0, status: 'idle', battery: 50, source: 'replay' };
}

describe('useReplay motion token', () => {
  beforeEach(() => {
    // Freeze the loop: we drive time manually via seek/restart, not rAF ticks.
    vi.stubGlobal('requestAnimationFrame', (() => 0) as unknown as typeof requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', (() => {}) as unknown as typeof cancelAnimationFrame);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('bumps on restart and on every seek, so the map can suppress the glide', () => {
    const dispatch = vi.fn();
    const onRestart = vi.fn();
    const events = [evt(0), evt(100), evt(500)];

    const { result } = renderHook(() => useReplay(dispatch, { events, enabled: true, onRestart }));
    const initial = result.current.motionToken;

    act(() => result.current.seekFraction(0.5)); // forward jump
    expect(result.current.motionToken).toBe(initial + 1);
    expect(onRestart).not.toHaveBeenCalled(); // forward seek doesn't reset the timeline

    act(() => result.current.seekFraction(0.1)); // backward jump
    expect(result.current.motionToken).toBe(initial + 2);
    expect(onRestart).toHaveBeenCalledTimes(1); // backward seek replays from zero

    act(() => result.current.restart());
    expect(result.current.motionToken).toBe(initial + 3);
    expect(result.current.currentT).toBe(0);
  });

  it('does not bump motionToken merely from a play/pause toggle mid-window', () => {
    const dispatch = vi.fn();
    const onRestart = vi.fn();
    const events = [evt(0), evt(100)];

    const { result } = renderHook(() => useReplay(dispatch, { events, enabled: true, onRestart }));
    const before = result.current.motionToken;

    act(() => result.current.pause());
    act(() => result.current.play());

    expect(result.current.motionToken).toBe(before);
  });
});
