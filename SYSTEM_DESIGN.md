# SYSTEM_DESIGN

These answers refer to the actual implementation in this repo. Each one names the
file/module where the change would land, following the structure: what happens
now → first limitation → concrete change → where.

---

## 1. Adding a new feature later — geofencing / zone alerts

**Concrete feature:** define rectangular "keep-out" or "slow" zones on the site
map; raise an attention flag when a robot is inside one.

**What happens in the current system.** Attention is already a centralised,
derived concept. `src/lib/statusClassification.ts` exposes `needsAttention(robot,
opts)` and `attentionReason(robot, opts)`, and every consumer
(`RobotMarker`, `RobotList`, `RobotDetails`, `fleetMetrics.summarise`,
`filterRobots`) goes through those two functions. Robot positions are already in
site-pixel units in `RobotState.x/y`.

**Where it plugs in.**

- A `zones` constant (or a small `useState` for user-drawn zones) in
  `src/lib/config.ts` / a new `src/lib/zones.ts` holding
  `{ id, kind, x, y, w, h }`.
- A pure `zoneViolation(robot, zones): Zone | null` in `zones.ts`.
- Extend `needsAttention` / `attentionReason` in `statusClassification.ts` to
  call it — one new clause, same signature. Every view picks the flag up for
  free because they already read those functions.
- Render: a `<ZoneLayer>` sibling of the markers in `SiteMap.tsx`, positioned
  with the same `x/900`, `y/560` percentage scheme the markers use.
- The trend chart would get a fourth stacked series only if we want
  "robots in violation over time" — `FleetSample` in `types/fleet.ts` and
  `toSample` in `fleetMetrics.ts` gain one field.

**Does the design accommodate it?** Yes, cleanly, because "attention" is one
function and map placement is one coordinate convention. The only refactor-ish
part is that `classify`/`needsAttention` currently take a single `RobotState`;
zones are external context, so they'd arrive through the existing `opts` argument
(`ClassifyOptions`) — extend the type, thread it from `useFleetController`'s
`attentionNowMs` the same way. No data-flow change.

**First limitation.** If geofencing needs to fire on the *crossing* (enter/exit
events, dwell time) rather than the instantaneous "is inside" check, the reducer
would need to compare previous vs next position. `fleetReducer.applyEvent`
already has `prev` in scope, so it would emit a derived `zoneEvents` list on the
state — that is a real, if small, reducer change.

---

## 2. Scaling from 8 to 500 robots — first thing that breaks

**The first bottleneck is React re-render / reconciliation of the map and list on
every event batch, not the reducer or the math.**

**Why specifically.** `fleetReducer` returns a new `state.robots` object on every
`apply`, so `useFleetController` re-renders `Dashboard` on every animation frame
(replay) or every tick (live). `Dashboard` then:

- rebuilds `listRobots` via `filterRobots` + `sortRobotsForList` — O(n log n),
  and its `useMemo` depends on `attentionNowMs` which changes every render in
  live mode, so it recomputes every frame regardless;
- renders `SiteMap`, which maps all `n` robots to `<RobotMarker>` (memoised, but
  still `n` diff checks), each computing `needsAttention` and inline styles;
- renders `RobotList` — `n` DOM rows, none virtualised.

At n = 8 this is microseconds. At n = 500, with ~100 events/s (500 robots every
5 s), that is 500 markers + 500 list rows reconciled several times a second, plus
Recharts re-rendering an area chart whose stacked series are recomputed from a
240-point series. The map animation drops frames first because it does the most
DOM work per render.

**What changes first, in order.**

1. **Decouple render rate from event rate.** In `useFleetController`, buffer
   incoming events and flush state to the view on a fixed ~10 Hz cadence
   (`requestAnimationFrame`-throttled `dispatch`), so 100 events/s still only
   causes ~10 renders/s. Single-file change.
2. **Virtualise `RobotList`** (`react-window`) so only visible rows mount.
3. **Move marker rendering to `<canvas>`** in `SiteMap.tsx` — one draw call per
   frame instead of `n` DOM nodes. The percentage-coordinate maths becomes
   `ctx` maths; the rest of the app is untouched because `SiteMap` is a leaf.
4. **Precompute derived fields in the reducer** (`operationalClass` per robot on
   write) so `filterRobots`/`summarise` stop recomputing `classify` for every
   robot on every render.
5. Only after that does the **data volume** itself matter — a 500-robot,
   1-hour history is ~360k events; that never enters the browser today (the log
   is bundled) but a real feed would need server-side downsampling before the
   WebSocket, which is Q3.

---

## 3. Limited bandwidth between robots and backend

**Now.** This frontend has no robot link — the log is bundled and the live feed
is generated in-page at a fixed ~8 events/s, full-fidelity JSON
(`{t, robot_id, x, y, status, battery}`, ~70 bytes/event). `parseEvent` in
`eventParser.ts` is the single ingestion point, so anything below is a change at
or before that boundary.

**What I would change (a real deployment, most effective first):**

- **Event-on-change / deadbanding.** Only publish when a field moves past a
  threshold: position > ~1 unit, battery ≥ 1 %, or any status change. A parked
  robot drops from 0.2 ev/s to near zero. Biggest win, and status changes — the
  operationally important events — are never suppressed.
- **Delta encoding.** Send `x/y` as int deltas from the last sent position;
  `battery` as a signed nibble. `eventParser` gains a "rehydrate delta against
  last known" step before validation.
- **Quantise.** Round positions to integers (1 unit = 1 px; sub-pixel is noise
  on a 900-px map) and battery to whole percent. Halves the numeric payload with
  zero visible loss.
- **Prioritise.** Two classes: `blocked/error/offline/maintenance` and low
  battery go immediately; `idle`/position-only updates are batched into one frame
  per second per robot.
- **Compact serialisation + batch framing.** One CBOR/MessagePack array per
  second per robot instead of N JSON objects; gzip/permessage-deflate on the
  socket. `config.ts` already centralises the rates this would tune.
- **Adaptive reporting.** Robot lowers its own rate when it detects RTT/backlog
  growth, floors at a heartbeat every ~10 s.

**Tradeoff: bandwidth vs freshness.** Every technique above trades update
latency/precision for bytes. Deadbanding means the dashboard can be up to one
threshold stale (a robot creeping toward a rack shows as stationary until it
moves 1 unit). Batching adds up to the batch interval of latency. The mitigation
is to make the *tier* explicit — safety-relevant transitions stay real-time,
cosmetic position updates degrade first — and to show the operator a per-robot
"last update" age (already in `RobotDetails.tsx`) plus a stale badge
(`statusClassification.isStale`) so degraded freshness is visible rather than
silent.

---

## 4. A robot dies mid-task and stops responding

**How it's detected now.** Every applied event stamps
`RobotState.lastSeenWallMs = Date.now()` in `fleetReducer.applyEvent`.
`statusClassification.isStale(robot, nowMs)` returns true once
`nowMs - lastSeenWallMs > ATTENTION.staleAfterMs` (15 s, in `config.ts`), and
`needsAttention` includes that clause. `useFleetController` passes a live
`attentionNowMs` only in live mode, and `TopBar`/`RobotDetails` re-render on a
1 s interval so the flag appears within ~1 s of the threshold.

**What the operator sees.** The robot's marker keeps its last known position and
starts pulsing red (`RobotMarker` attention ring); it jumps to the top of
`RobotList` (attention-first sort); the "Needs attention" summary tile
increments; `RobotDetails` shows *"No telemetry received recently (stale)"* as
the attention reason and a growing "Last update: Ns ago". The trend chart's
`attention` band steps up at that sample.

**First limitation.** Staleness is inferred purely from *absence* of messages and
only in live mode. It cannot distinguish "robot crashed" from "network
partition" from "robot fine, uplink down", and there is no explicit `offline`
transition — the robot is stuck displaying its last real status
(e.g. `on_mission`) with a stale badge layered on top, which is slightly
contradictory.

**Concrete change.** In `fleetReducer.ts`, run a periodic sweep (dispatched from
a `setInterval` in `useFleetController`) that, for any robot past a hard timeout
(say 3× the heartbeat), writes a synthetic `status: 'offline'` event through the
normal `apply` path — so the state, the chart and the classification all agree,
and the transition is a real datapoint rather than a render-time overlay.

**The unfinished task, at system-design level.** This frontend has no task model
(the two `task_event`s in the log are surfaced but not tracked). In the full
system: the backend owns task assignment; on a robot heartbeat timeout it marks
that robot's active task `interrupted`, releases any reservation/zone lock the
task held, and either requeues it for another eligible robot or escalates to the
operator if it was location-bound. The dashboard would show the task as
`interrupted` on the robot's detail panel and in a mission layer, and — once the
robot reconnects — reconcile: if the robot reports the task still in progress,
adopt its view; if it reports idle, confirm the requeue.

---

## 5. Slow / unreliable robot ↔ backend connection

**What the rest of the system sees today.**

- **Delayed messages:** the affected robot's marker simply stops moving; after
  15 s it goes stale (Q4). Other robots are unaffected — state is per-robot.
- **Out-of-order / duplicate messages:** handled. `fleetReducer.applyEvent`
  drops any event whose `t` is `< robot.lastEventT`, so a late or re-sent packet
  cannot rewind a robot's position, battery or status. Verified in
  `fleetReducer.test.ts`.
- **Missing messages (gaps):** the robot holds its last known state; there is no
  interpolation, so on reconnect it "teleports" to its current real position in
  one frame.
- **Reconnect:** in the live sim there is no socket, so this is the in-browser
  analogue — switching mode dispatches `{ type: 'rebase' }` which rewinds
  `lastEventT` to `-1` so a fresh `t` sequence is accepted without being
  rejected as stale.

**Where each behaviour lives:** ordering guard — `fleetReducer.applyEvent`;
staleness — `statusClassification.isStale` + `ATTENTION.staleAfterMs`;
validation of garbled payloads — `eventParser.parseEvent` (rejects NaN/unknown
status, clamps ranges).

**How I'd strengthen it for production.**

1. **Sequence numbers, not just `t`.** Add a monotonic per-robot `seq` to the
   wire format and drop `seq <= lastSeq` in the reducer. `t` is a simulation
   timestamp; two real events can share a timestamp, and clock skew makes `t`
   unreliable as an ordering key. Change is one field in `FleetEvent`
   (`types/fleet.ts`) and one comparison in `applyEvent`.
2. **Gap detection + resync.** If `seq` jumps by more than 1, the client knows it
   missed events. For this dashboard "latest wins" is fine so it just carries on,
   but it should request a state snapshot (`GET /robots`) on WebSocket reconnect
   and apply it as a bulk `apply` before resuming the stream — so a client that
   was disconnected for a minute doesn't sit on minute-old data.
3. **Explicit reconnect handling in a `useFleetSocket` hook** (replacing
   `useLiveFeed` for the real feed): exponential backoff, a visible
   "reconnecting" state in `TopBar` (the `FeedState` component is already the
   place for it), and a snapshot-then-stream sequence on every (re)connect.
4. **Bounded staleness UI** (already partly there): once any robot is stale or
   the socket is down, the header shows a global "data may be stale" banner so
   the operator never mistakes a frozen dashboard for a calm site.
5. **Client-side dedupe window** keyed on `(robot_id, seq)` for the last ~200
   events, to absorb duplicate delivery from an at-least-once transport without
   relying solely on the monotonic guard (which is correct but silently discards,
   making duplication invisible in metrics).

**Recovery once healthy.** With (2)+(3): on reconnect the client pulls a full
snapshot, applies it, then resumes the live stream; the monotonic `seq` guard
discards any overlap between the snapshot and buffered stream events. The
operator sees each robot jump once to its true current state and the stale
badges clear within one heartbeat.
