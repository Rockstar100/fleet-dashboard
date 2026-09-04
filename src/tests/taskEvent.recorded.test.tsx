import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { recordedEvents, roster } from '../data';
import { fleetReducer, initFleetState } from '../lib/fleetReducer';
import { RobotDetails } from '../components/robots/RobotDetails';

afterEach(cleanup);

describe('recorded task_event → Last task UI', () => {
  it('shows empty copy for r3 before its only task_event at t=380', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, {
      type: 'apply',
      events: recordedEvents.filter((e) => e.t <= 40),
      nowMs: 1,
    });
    expect(state.robots.r3!.lastTaskEvent).toBeUndefined();

    render(<RobotDetails robot={state.robots.r3!} mode="replay" onClear={() => {}} />);
    expect(screen.getByTestId('last-task-value')).toHaveTextContent('No task event yet');
  });

  it('shows Task Started for r3 once t>=380 has been applied', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, {
      type: 'apply',
      events: recordedEvents.filter((e) => e.t <= 380),
      nowMs: 1,
    });
    expect(state.robots.r3!.lastTaskEvent).toBe('task_started');

    render(<RobotDetails robot={state.robots.r3!} mode="replay" onClear={() => {}} />);
    expect(screen.getByTestId('last-task-value')).toHaveTextContent('Task Started');
  });

  it('shows Task Completed for r6 once t>=55 has been applied', () => {
    let state = initFleetState(roster);
    state = fleetReducer(state, {
      type: 'apply',
      events: recordedEvents.filter((e) => e.t <= 55),
      nowMs: 1,
    });
    expect(state.robots.r6!.lastTaskEvent).toBe('task_completed');

    render(<RobotDetails robot={state.robots.r6!} mode="replay" onClear={() => {}} />);
    expect(screen.getByTestId('last-task-value')).toHaveTextContent('Task Completed');
  });
});
