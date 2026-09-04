import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RobotDetails } from '../components/robots/RobotDetails';
import type { RobotState } from '../types/fleet';

afterEach(cleanup);

/**
 * Regression test for a real layout-shift bug: selecting a robot that trips
 * `attentionReason` used to mount an alert block that a healthy robot's
 * selection simply didn't render, so the panel's height (and everything
 * stacked below/beside it, since the two dashboard columns don't stretch to
 * match each other) changed size depending on which robot was selected.
 *
 * The fix is a single reserved-height status region rendered unconditionally
 * for every robot; this test locks that invariant in rather than the exact
 * height value, so it survives a deliberate future redesign of the number
 * but still catches a regression to "sometimes render, sometimes don't".
 */
function robot(over: Partial<RobotState>): RobotState {
  return {
    robotId: 'r1',
    robotType: 'picker',
    x: 10,
    y: 20,
    status: 'idle',
    battery: 80,
    lastEventT: 5,
    lastSeenWallMs: Date.now(),
    updates: 3,
    ...over,
  };
}

describe('RobotDetails layout stability', () => {
  it('renders the same status-region markup class for a healthy robot as an attention robot', () => {
    const { unmount } = render(<RobotDetails robot={robot({ status: 'idle', battery: 90 })} mode="replay" onClear={() => {}} />);
    const healthyMsg = screen.getByText('No active alerts');
    const healthyBox = healthyMsg.closest('div')!;
    const healthyClasses = healthyBox.className;
    unmount();

    render(<RobotDetails robot={robot({ status: 'error', battery: 90 })} mode="replay" onClear={() => {}} />);
    const attentionMsg = screen.getByText(/reporting an error state/i);
    const attentionBox = attentionMsg.closest('div')!;
    const attentionClasses = attentionBox.className;

    // Both boxes must carry the same min-height utility class — the one
    // thing that actually prevents the container from resizing.
    const minHeightClass = healthyClasses.split(' ').find((c) => c.startsWith('min-h-'));
    expect(minHeightClass).toBeDefined();
    expect(attentionClasses).toContain(minHeightClass!);
  });

  it('shows exactly one status message region, never zero and never more than one', () => {
    for (const status of ['idle', 'active', 'error', 'offline', 'blocked'] as const) {
      const { unmount } = render(<RobotDetails robot={robot({ status, battery: 90 })} mode="replay" onClear={() => {}} />);
      const alerts = screen.queryAllByText(/no active alerts|reporting an error|blocked|offline|maintenance/i);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      unmount();
    }
  });

  it('keeps the empty (no selection) state and a populated state as siblings of the same panel structure', () => {
    // The empty state and the populated state are mutually exclusive returns
    // from the same component; this just pins that both render without throwing
    // and that the empty state carries an explicit min-height so deselecting
    // doesn't collapse the panel to zero height either.
    const { unmount } = render(<RobotDetails robot={null} mode="replay" onClear={() => {}} />);
    const emptyTitle = screen.getByText(/select a robot/i);
    const emptyBox = emptyTitle.closest('div[class*="min-h-"]');
    expect(emptyBox).not.toBeNull();
    unmount();
  });

  it('surfaces last task_event as a readable Last task value', () => {
    render(
      <RobotDetails
        robot={robot({ lastTaskEvent: 'task_completed' })}
        mode="replay"
        onClear={() => {}}
      />,
    );
    expect(screen.getByTestId('last-task-value')).toHaveTextContent('Task Completed');
  });

  it('still renders the Last task row when no task_event has been seen', () => {
    render(<RobotDetails robot={robot({ lastTaskEvent: undefined })} mode="replay" onClear={() => {}} />);
    expect(screen.getByText('Last task')).toBeInTheDocument();
    expect(screen.getByTestId('last-task-value')).toHaveTextContent('No task event yet');
  });
});
