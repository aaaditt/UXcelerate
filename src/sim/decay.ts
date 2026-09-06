import type { Cell, Confidence, Robot } from './types'

/**
 * Confidence decay.
 *
 * Every other entry in this competition treats uncertainty as a static state:
 * a tile is "explored" or it is not. In a real collapse that is a lie. Rubble
 * shifts, aftershocks re-block cleared routes, and a corridor walked twenty
 * minutes ago is no longer a corridor you can promise anyone.
 *
 * So confidence is a function of AGE, not a stored flag. The map visibly
 * forgets, and the commander can see the picture rotting in real time.
 */

/** Minutes before an observation degrades one step. */
const HALF_LIFE: Record<Confidence, number> = {
  confirmed: 14,
  reported: 9,
  inferred: Infinity,
  unknown: Infinity,
}

const NEXT: Record<Confidence, Confidence> = {
  confirmed: 'reported',
  reported: 'inferred',
  inferred: 'inferred',
  unknown: 'unknown',
}

/** Confidence of a single observation, aged forward to `now`. */
export function decayed(base: Confidence, observedAt: number | null, now: number): Confidence {
  if (observedAt === null) return base
  let conf = base
  let age = Math.max(0, now - observedAt)
  // Walk down the ladder, spending age at each rung's half-life.
  while (age >= HALF_LIFE[conf]) {
    age -= HALF_LIFE[conf]
    const next = NEXT[conf]
    if (next === conf) break
    conf = next
  }
  return conf
}

/** 0..1 — how far through its current rung an observation has aged. */
export function stalenessRatio(cell: Cell, now: number): number {
  if (cell.observedAt === null) return 1
  const conf = decayed(cell.conf, cell.observedAt, now)
  const life = HALF_LIFE[conf]
  if (!isFinite(life)) return 1
  const age = now - cell.observedAt
  return Math.min(1, (age % life) / life)
}

/**
 * Radius, in cells, of the "it could be anywhere in here" ellipse around a
 * robot we have lost contact with. Grows with time since last contact, because
 * that is the honest thing to draw. A dark robot is never removed from the map.
 */
export function uncertaintyRadius(robot: Robot, now: number): number {
  if (robot.link === 'live') return 0
  const minutesDark = Math.max(0, now - robot.lastContact)
  const growth = minutesDark * robot.driftRate
  // Degraded links still give us coarse position, so cap them tightly.
  const cap = robot.link === 'degraded' ? 1.2 : 6.5
  return Math.min(cap, growth)
}

export function ageLabel(observedAt: number | null, now: number): string {
  if (observedAt === null) return 'never observed'
  const age = Math.max(0, Math.round(now - observedAt))
  if (age === 0) return 'just now'
  if (age === 1) return '1 min ago'
  return `${age} min ago`
}
