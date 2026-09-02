# ANSWERS

## 1. What holds the fleet's state as data arrives, and why that shape?

The current fleet state lives in a single `useReducer(fleetReducer, ...)` inside
`src/hooks/useFleetController.ts`. The state shape is
`FleetState = { robots: Record<robotId, RobotState>, clockT: number }`
(defined in `src/types/fleet.ts`); `fleetReducer` in
`src/lib/fleetReducer.ts` is the only function that produces a new `FleetState`.

The shape is a **keyed map of current-state-per-robot**, not an event list,
because every view needs random access to "the latest state of robot X" and none
of them needs the raw history: `SiteMap` reads all robots to place markers,
`RobotList`/`filterRobots.ts` filter and sort them, `RobotDetails` reads one,
and `fleetMetrics.ts` folds over `Object.values(state.robots)` for the summary
tiles and each trend sample. A `Record` gives O(1) updates and lookups and makes
last-write-wins trivial to enforce.

Replay and live feed drive the same state because they are only *producers of
`FleetEvent[]`*. `useReplay.ts` (a `requestAnimationFrame` virtual clock) and
`useLiveFeed.ts` (a `setInterval` tick calling `liveSimulator.ts`) both funnel
their events through the same `parseEvent` normaliser and then call the same
`dispatch({ type: 'apply', events })`. There is no second store to keep in sync,
so the map, list, detail panel and chart cannot disagree about a robot no matter
which source is active. Switching source dispatches
`{ type: 'rebase' }`, which keeps robots at their current on-screen positions but
resets `lastEventT` to `-1` so the next source's low `t` values are accepted
rather than rejected by the staleness guard.

## 2. One real tradeoff, and what it cost.

**Seeking backwards in replay resets to `t = 0` and fast-forwards, instead of
restoring a stored snapshot.**

*Alternatives considered:* (a) keep a ring buffer of `FleetState` snapshots keyed
by event-bucket index, so any seek is an O(1) state swap; (b) make the reducer
reversible; (c) accept replay-from-zero.

*Chosen:* (c). `seekFraction` in `src/hooks/useReplay.ts` checks if the target
time is behind the current virtual time; if so it calls `onRestart()`
(which dispatches `{ type: 'reset' }` in `useFleetController`) and then replays
the `eventsInWindow(buckets, 0, target)` slice in one `dispatch`.

*Why:* the recorded window is 181 buckets / ~1450 events. Replaying all of them
is a single synchronous reduce that completes in well under a frame, so the user
sees an instant jump anyway. Snapshotting would mean deep-copying `FleetState` on
every bucket and reasoning about when to invalidate the buffer on mode switches —
real complexity for a fixed 15-minute log.

*What it improved:* `useReplay.ts` stays small and the reducer stays purely
forward-only, which keeps the last-write-wins invariant (the thing the tests
actually pin) easy to reason about.

*What it cost:* forward seeks are cheap but backward seeks do redundant work, and
the trend series (`useFleetMetrics.ts`) rebuilds from scratch after a backward
seek because it is cleared on `reset`. For an 8-robot / 15-minute dataset that is
invisible; for a multi-hour log it would need the snapshot buffer from
alternative (a).

## 3. What I left out, and what I'd build next.

**Left out deliberately:** persistence (reload restarts replay and clears live
history — not required); a real network live-feed server (the challenge allows
in-browser generation, and it removes a deploy target and a cold-start failure
mode); per-robot history — the reducer keeps only current state plus an
`updates` counter, so there are no battery/status sparklines in the detail panel;
obstacle-aware movement in `liveSimulator.ts` (robots respect the outer site
bounds but not the drawn racks); an alert/acknowledge log for attention-state
transitions; and responsive design below one breakpoint beyond a single-column
collapse.

**Build next, in priority order:** (1) a time-indexed snapshot ring in
`useReplay.ts` so scrubbing is instant both ways; (2) a bounded per-robot history
ring in `fleetReducer.ts` to power detail-panel sparklines; (3) a small `ws`
Node server for the live feed, deployed alongside, with the browser generator
kept as the offline fallback, so reconnect/backpressure are demonstrable;
(4) a first-seen alert log with acknowledge so transient faults during 20×
replay aren't missed. Rationale: each is a real operator need, and items 1–2 slot
into existing modules without changing the one-reducer/two-producers
architecture.
