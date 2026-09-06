import { decayed } from './decay'
import { GRID_H, GRID_W } from './seed'
import type { Confidence, MissionState, Robot, Survivor } from './types'

/**
 * Triage scoring.
 *
 * The competing entries rank robots. This ranks PEOPLE, and it shows its
 * working. A commander cannot act on a number they do not believe, so every
 * score decomposes into three legible factors and every ranking carries a
 * counterfactual: "this moves to rank 1 if Almeida St is confirmed passable".
 *
 *   survivability — how long do they likely have
 *   reachability  — how much do we trust the route to them
 *   effort        — what does it cost us to get there
 *
 * Reachability is the interesting one: it is computed over the DECAYED map, so
 * a route we verified twenty minutes ago scores worse than one we walked just
 * now, without anybody re-writing the data.
 */

const CONF_WEIGHT: Record<Confidence, number> = {
  confirmed: 1,
  reported: 0.72,
  inferred: 0.4,
  unknown: 0.12,
}

const VOID_WEIGHT = { good: 1, moderate: 0.82, tight: 0.55, none: 0.3 }

export interface RouteResult {
  reachable: boolean
  steps: number
  /** Product of per-cell confidence along the path: 0..1. */
  trust: number
  /** The weakest link — the cell we are least sure about. */
  weakest: Confidence
  /** Contested facts this route depends on. */
  contestIds: string[]
}

/**
 * Dijkstra over the decayed belief map from `from` to `to`.
 * Cost per step is the inverse of our confidence in that cell, so the route
 * that wins is the one we most believe in, not merely the shortest.
 */
export function route(
  s: MissionState,
  from: { x: number; y: number },
  to: { x: number; y: number },
  opts: { ignoreContested?: boolean } = {},
): RouteResult {
  const contestedCells = new Map<string, string>()
  for (const f of s.contests) {
    if (f.resolution) continue
    for (const [x, y] of f.cells) contestedCells.set(`${x},${y}`, f.id)
  }

  const key = (x: number, y: number) => y * GRID_W + x
  const dist = new Float64Array(GRID_W * GRID_H).fill(Infinity)
  const prev = new Int32Array(GRID_W * GRID_H).fill(-1)
  const seen = new Uint8Array(GRID_W * GRID_H)

  const start = key(from.x, from.y)
  dist[start] = 0
  // Small grid — a linear scan beats a heap in both speed and readability here.
  for (;;) {
    let best = -1
    let bestD = Infinity
    for (let i = 0; i < dist.length; i++) {
      if (!seen[i] && dist[i] < bestD) {
        bestD = dist[i]
        best = i
      }
    }
    if (best < 0) break
    seen[best] = 1
    const cx = best % GRID_W
    const cy = Math.floor(best / GRID_W)
    if (cx === to.x && cy === to.y) break

    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
      const cell = s.grid[ny][nx]
      const conf = decayed(cell.conf, cell.observedAt, s.now)
      const isContested = contestedCells.has(`${nx},${ny}`)
      // An unresolved contest is treated as impassable unless we are asking the
      // counterfactual "what if it were clear?"
      // The destination is always enterable: you can reach the edge of a void
      // even when the void itself is not traversable ground.
      const isTarget = nx === to.x && ny === to.y
      if (!cell.passable && !isTarget && !(isContested && opts.ignoreContested)) continue
      const w = 1 / CONF_WEIGHT[conf]
      const nk = key(nx, ny)
      if (dist[best] + w < dist[nk]) {
        dist[nk] = dist[best] + w
        prev[nk] = best
      }
    }
  }

  const end = key(to.x, to.y)
  if (!isFinite(dist[end])) {
    return { reachable: false, steps: 0, trust: 0, weakest: 'unknown', contestIds: [] }
  }

  let trust = 1
  let weakest: Confidence = 'confirmed'
  const ids = new Set<string>()
  let steps = 0
  for (let cur = end; cur !== -1 && cur !== start; cur = prev[cur]) {
    const cx = cur % GRID_W
    const cy = Math.floor(cur / GRID_W)
    const cell = s.grid[cy][cx]
    const conf = decayed(cell.conf, cell.observedAt, s.now)
    trust *= CONF_WEIGHT[conf]
    if (CONF_WEIGHT[conf] < CONF_WEIGHT[weakest]) weakest = conf
    const cid = contestedCells.get(`${cx},${cy}`)
    if (cid) ids.add(cid)
    steps++
  }
  // Normalise so long confident routes are not punished into nothing.
  const normTrust = steps > 0 ? Math.pow(trust, 1 / steps) : 1
  return { reachable: true, steps, trust: normTrust, weakest, contestIds: [...ids] }
}

export interface Factor {
  label: string
  value: number
  detail: string
}

export interface TriageEntry {
  survivor: Survivor
  score: number
  survivability: number
  reachability: number
  effort: number
  factors: Factor[]
  bestRobot: Robot | null
  route: RouteResult
  /** Populated when resolving a contest would change this entry's standing. */
  counterfactual: { contestId: string; delta: number; text: string } | null
}

function survivability(s: Survivor, now: number): { v: number; factors: Factor[] } {
  const ageMin = Math.max(0, now - s.detectedAt)
  // Slow decline over the demo window; the real curve is hours, compressed here.
  const timePenalty = Math.max(0.45, 1 - ageMin * 0.018)
  const voidW = VOID_WEIGHT[s.voidSpace]
  const corroboration = Math.min(1, 0.55 + s.signals.length * 0.15)
  const v = s.vitalsConfidence * voidW * timePenalty * corroboration
  return {
    v,
    factors: [
      { label: 'Vitals confidence', value: s.vitalsConfidence, detail: `${s.signals.join(' + ')} — ${Math.round(s.vitalsConfidence * 100)}% sure a person is there` },
      { label: 'Void space', value: voidW, detail: `${s.voidSpace} void — survivable volume around the casualty` },
      { label: 'Corroboration', value: corroboration, detail: `${s.signals.length} independent sensor${s.signals.length === 1 ? '' : 's'} agree` },
      { label: 'Time since detection', value: timePenalty, detail: `${Math.round(ageMin)} min elapsed` },
    ],
  }
}

function capable(r: Robot): boolean {
  return r.cls !== 'aerial' && r.link !== 'lost'
}

export function triage(s: MissionState): TriageEntry[] {
  const entries: TriageEntry[] = s.survivors.map((surv) => {
    const { v: surviveV, factors } = survivability(surv, s.now)

    let bestRobot: Robot | null = null
    let bestRoute: RouteResult = { reachable: false, steps: 0, trust: 0, weakest: 'unknown', contestIds: [] }
    for (const r of s.robots) {
      if (!capable(r)) continue
      const res = route(s, r, surv)
      if (!res.reachable) continue
      if (!bestRobot || res.steps / Math.max(res.trust, 0.05) < bestRoute.steps / Math.max(bestRoute.trust, 0.05)) {
        bestRobot = r
        bestRoute = res
      }
    }

    const reachability = bestRoute.reachable ? bestRoute.trust : 0.05
    const effort = bestRoute.reachable ? Math.max(0.15, 1 - bestRoute.steps / 60) : 0.05
    // A dark unit can be tasked, but we cannot promise it heard us.
    const linkPenalty = bestRobot && (bestRobot.link === 'dark' || bestRobot.link === 'lost') ? 0.7 : 1

    const score = surviveV * reachability * effort * linkPenalty * 1000

    return {
      survivor: surv,
      score,
      survivability: surviveV,
      reachability,
      effort,
      factors: [
        ...factors,
        {
          label: 'Route trust',
          value: reachability,
          detail: bestRoute.reachable
            ? `${bestRoute.steps} cells, weakest link is ${bestRoute.weakest}`
            : 'no believed route exists',
        },
      ],
      bestRobot,
      route: bestRoute,
      counterfactual: null,
    }
  })

  entries.sort((a, b) => b.score - a.score)

  // Counterfactuals: re-rank with each unresolved contest assumed passable, and
  // report any survivor whose position materially moves. This is the link that
  // makes adjudication feel consequential rather than administrative.
  const open = s.contests.filter((f) => !f.resolution)
  for (const fact of open) {
    const alt = entries.map((e) => {
      const r = e.bestRobot ? route(s, e.bestRobot, e.survivor, { ignoreContested: true }) : e.route
      const reach = r.reachable ? r.trust : 0.05
      const eff = r.reachable ? Math.max(0.15, 1 - r.steps / 60) : 0.05
      return { id: e.survivor.id, score: e.survivability * reach * eff * 1000 }
    })
    alt.sort((a, b) => b.score - a.score)
    entries.forEach((e, i) => {
      const j = alt.findIndex((a) => a.id === e.survivor.id)
      if (j >= 0 && j < i && !e.counterfactual) {
        e.counterfactual = {
          contestId: fact.id,
          delta: i - j,
          text: `Rank ${i + 1} → ${j + 1} if ${fact.subject} is confirmed passable`,
        }
      }
    })
  }

  return entries
}
