import { describe, expect, it } from 'vitest';
import { parseEvent, parseEventLog } from '../lib/eventParser';
import { SITE } from '../lib/config';

describe('parseEvent', () => {
  it('accepts a well-formed record', () => {
    const { event } = parseEvent(
      { t: 55, robot_id: 'r6', x: 602.7, y: 344.8, status: 'on_mission', battery: 43.7 },
      'replay',
    );
    expect(event).toMatchObject({ t: 55, robotId: 'r6', status: 'on_mission', battery: 43.7, source: 'replay' });
  });

  it('rejects an unknown status', () => {
    const { event, error } = parseEvent({ t: 1, robot_id: 'r1', x: 0, y: 0, status: 'napping', battery: 50 }, 'live');
    expect(event).toBeNull();
    expect(error).toContain('unknown status');
  });

  it('rejects NaN / missing numeric fields', () => {
    expect(parseEvent({ t: 1, robot_id: 'r1', x: 'foo', y: 0, status: 'idle', battery: 50 }, 'live').event).toBeNull();
    expect(parseEvent({ t: 1, robot_id: 'r1', x: 0, y: 0, status: 'idle' }, 'live').event).toBeNull();
  });

  it('clamps coordinates and battery into valid ranges', () => {
    const { event } = parseEvent(
      { t: 1, robot_id: 'r1', x: -50, y: 99_999, status: 'idle', battery: 140 },
      'live',
    );
    expect(event?.x).toBe(0);
    expect(event?.y).toBe(SITE.height);
    expect(event?.battery).toBe(100);
  });

  it('keeps a recognised task_event and drops an unrecognised one', () => {
    expect(
      parseEvent({ t: 1, robot_id: 'r1', x: 0, y: 0, status: 'idle', battery: 5, task_event: 'task_started' }, 'replay')
        .event?.taskEvent,
    ).toBe('task_started');
    expect(
      parseEvent({ t: 1, robot_id: 'r1', x: 0, y: 0, status: 'idle', battery: 5, task_event: 'exploded' }, 'replay').event
        ?.taskEvent,
    ).toBeUndefined();
  });
});

describe('parseEventLog', () => {
  it('skips malformed lines and returns the rest sorted by t', () => {
    const log = [
      '{"t": 10, "robot_id": "r1", "x": 1, "y": 1, "status": "idle", "battery": 50}',
      'not json',
      '{"t": 0, "robot_id": "r1", "x": 2, "y": 2, "status": "active", "battery": 49}',
      '',
    ].join('\n');
    const events = parseEventLog(log);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.t)).toEqual([0, 10]);
  });
});
