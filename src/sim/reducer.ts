import { decayed } from './decay'
import { seedState, snapToPassable } from './seed'
import { EVENTS } from './script'
import type { MissionEvent, MissionState, Order } from './types'

/**
 * The fold.
 *
 *     state(T) = EVENTS.filter(e => e.known <= T)   // what Command has RECEIVED
 *                      .sort(by e.t)                // applied in OCCURRENCE order
 *                      .reduce(applyEvent, seed)
 *
 * Filtering on `known` and ordering on `t` is the entire trick. A burst of
 * late-delivered observations slots into the timeline at the moment it really
 * happened, so a T+09 observation delivered at T+11 is two minutes stale the
 * instant it lands — and if it contradicts something we believed at T+10, the
 * later-occurring fact still wins.
 *
 * Everything else the interface does — the scrubber, "what did we know at
 * T+04", confidence decay, the reconnect burst — falls out of this for free.
 */

/** Commander decisions live outside the scripted log; they are replayed on top. */
export interface Adjudication {
  factId: string
  choice: 'a' | 'b' | 'verify'
  at: number
}

export interface Assignment {
  survivorId: string
  robotId: string
  at: number
}

export interface Decisions {
  adjudications: Adjudication[]
  assignments: Assignment[]
}

export const NO_DECISIONS: Decisions = { adjudications: [], assignments: [] }

function applyEvent(s: MissionState, e: MissionEvent): MissionState {
  switch (e.kind) {
    case 'observe': {
      for (const c of e.cells) {
        const cell = s.grid[c.y]?.[c.x]
        if (!cell) continue
        // Only overwrite if this observation is NEWER than what the cell holds.
        // Backfill can arrive after a later observation; occurrence order wins.
        if (cell.observedAt !== null && cell.observedAt > e.t) continue
        cell.conf = e.conf
        cell.passable = c.passable
        cell.observedAt = e.t
        cell.observedBy = e.by
        if (c.kind) cell.kind = c.kind
      }

      // A unit that physically drove the ground produces evidence, and evidence
      // settles a dispute that two remote sensors could only argue about. This
      // is what makes the T+11 backfill actually resolve the T+04 contest
      // rather than merely narrating that it did.
      if (e.conf === 'confirmed') {
        const observed = new Map(e.cells.map((c) => [`${c.x},${c.y}`, c.passable]))
        for (const fact of s.contests) {
          if (fact.resolution) continue
          const covered = fact.cells.every(([x, y]) => observed.has(`${x},${y}`))
          if (!covered) continue
          const passable = observed.get(`${fact.cells[0][0]},${fact.cells[0][1]}`)!
          const side = fact.claimA.passable === passable ? 'a' : 'b'
          fact.resolution = side
          fact.resolvedAt = e.t
          fact.resolvedBy = e.by
        }
      }
      return s
    }

    case 'move': {
      const r = s.robots.find((r) => r.id === e.robot)
      if (r) {
        // Aerial units are not bound by ground passability; everyone else is.
        const pos = r.cls === 'aerial' ? { x: e.x, y: e.y } : snapToPassable(s.grid, e.x, e.y)
        r.x = pos.x
        r.y = pos.y
        if (r.link === 'live' || r.link === 'degraded') r.lastContact = e.t
      }
      return s
    }

    case 'link': {
      const r = s.robots.find((r) => r.id === e.robot)
      if (r) {
        r.link = e.link
        if (e.link === 'live' || e.link === 'degraded') {
          r.lastContact = e.t
          // Reconnection flushes the queue: the unit finally hears its orders.
          r.orders = r.orders.map((o) =>
            o.acknowledgedAt === null ? { ...o, acknowledgedAt: e.t } : o,
          )
        }
      }
      return s
    }

    case 'survivor': {
      if (!s.survivors.some((x) => x.id === e.survivor.id)) {
        s.survivors.push({ ...e.survivor })
      }
      return s
    }

    case 'hazard': {
      if (!s.hazards.some((x) => x.id === e.hazard.id)) s.hazards.push({ ...e.hazard })
      return s
    }

    case 'contest': {
      if (!s.contests.some((x) => x.id === e.fact.id)) s.contests.push({ ...e.fact })
      return s
    }

    case 'aftershock': {
      // The honest consequence of a shake: everything you had verified is
      // downgraded to hearsay, and the named cells become impassable.
      for (const row of s.grid) {
        for (const cell of row) {
          if (cell.conf === 'confirmed') {
            cell.conf = 'reported'
            // Age the observation so the decay clock reflects the demotion.
            if (cell.observedAt !== null) cell.observedAt = Math.min(cell.observedAt, e.t - 6)
          }
        }
      }
      for (const [x, y] of e.cells) {
        const cell = s.grid[y]?.[x]
        if (!cell) continue
        cell.passable = false
        cell.kind = 'rubble'
        cell.conf = 'reported'
        cell.observedAt = e.t
        cell.observedBy = 'SEISMIC'
      }
      return s
    }

    case 'log': {
      s.log.push({
        t: e.t,
        known: e.known,
        text: e.text,
        tone: e.tone,
        backfilled: e.known > e.t + 0.01,
      })
      return s
    }
  }
}

/** Apply commander decisions taken at or before `now`. */
function applyDecisions(s: MissionState, d: Decisions, now: number): MissionState {
  for (const a of d.adjudications) {
    if (a.at > now) continue
    const fact = s.contests.find((f) => f.id === a.factId)
    if (!fact) continue
    // Physical evidence outranks a judgement call made earlier on worse data.
    if (fact.resolvedBy && fact.resolvedBy !== 'command' && (fact.resolvedAt ?? 0) > a.at) continue
    fact.resolution = a.choice
    fact.resolvedAt = a.at
    fact.resolvedBy = 'command'
    if (a.choice === 'a' || a.choice === 'b') {
      const claim = a.choice === 'a' ? fact.claimA : fact.claimB
      for (const [x, y] of fact.cells) {
        const cell = s.grid[y]?.[x]
        if (!cell) continue
        cell.passable = claim.passable
        cell.conf = 'confirmed'
        cell.observedAt = a.at
        cell.observedBy = `${claim.by} (adjudicated)`
      }
    }
  }

  for (const a of d.assignments) {
    if (a.at > now) continue
    const surv = s.survivors.find((x) => x.id === a.survivorId)
    const robot = s.robots.find((r) => r.id === a.robotId)
    if (!surv || !robot) continue
    surv.status = 'assigned'
    surv.assignedTo = a.robotId
    const order: Order = {
      id: `${a.survivorId}-${a.robotId}`,
      issuedAt: a.at,
      // A dark unit cannot hear you. The order is not lost — it waits.
      acknowledgedAt: robot.link === 'dark' || robot.link === 'lost' ? null : a.at,
      summary: `Proceed to ${surv.label}`,
      targetId: a.survivorId,
    }
    if (!robot.orders.some((o) => o.id === order.id)) robot.orders.push(order)
  }

  return s
}

/** Fold the log up to mission-minute `now`, then replay commander decisions. */
export function stateAt(now: number, decisions: Decisions = NO_DECISIONS): MissionState {
  const received = EVENTS.filter((e) => e.known <= now).sort((a, b) => a.t - b.t || a.known - b.known)
  const s = received.reduce(applyEvent, seedState())
  s.now = now
  applyDecisions(s, decisions, now)
  // The log is what Command has *received*, so it reads in arrival order.
  s.log.sort((a, b) => b.known - a.known || b.t - a.t)
  return s
}

/** Effective confidence of a cell right now, after decay. */
export function cellConfidence(s: MissionState, x: number, y: number) {
  const cell = s.grid[y]?.[x]
  if (!cell) return 'unknown' as const
  return decayed(cell.conf, cell.observedAt, s.now)
}

/** Share of the sector we can currently claim to have verified. */
export function coverage(s: MissionState) {
  let confirmed = 0
  let reported = 0
  let total = 0
  for (const row of s.grid) {
    for (const cell of row) {
      total++
      const c = decayed(cell.conf, cell.observedAt, s.now)
      if (c === 'confirmed') confirmed++
      else if (c === 'reported') reported++
    }
  }
  return { confirmed, reported, total, pct: Math.round((confirmed / total) * 100) }
}
