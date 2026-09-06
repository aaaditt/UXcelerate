import type { Cell, Confidence, Robot } from './types'

/**
 * Confidence decay.
 *
 * The conventional treatment of uncertainty is a static state: a tile is
 * "explored" or it is not. In a real collapse that is a lie. Rubble shifts,
 * aftershocks re-block cleared routes, and a corridor walked twenty minutes
 * ago is no longer a corridor you can promise anyone.
 *
 * So confidence is a function of AGE, not a stored flag. The map visibly
 * forgets, and the commander can watch the picture rot in real time.
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

/** Where each tier sits on a 0..1 certainty scale. */
export const TIER_CERTAINTY: Record<Confidence, number> = {
  confirmed: 1,
  reported: 0.58,
  inferred: 0.36,
  unknown: 0.12,
}

export const HALF_LIFE_OF = (c: Confidence) => HALF_LIFE[c]

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
 * Continuous certainty, 0..1.
 *
 * The tiers are what the commander reads and what the legend explains, but
 * belief does not actually step — it slides. Interpolating between a tier and
 * the one below it, by how far through its half-life the observation has aged,
 * means ground dims continuously on screen instead of snapping a shade darker
 * every fourteen minutes. Watching the map fade is the whole argument.
 */
export function certainty(cell: Cell, now: number): number {
  const tier = decayed(cell.conf, cell.observedAt, now)
  const here = TIER_CERTAINTY[tier]
  const below = TIER_CERTAINTY[NEXT[tier]]
  if (cell.observedAt === null || !isFinite(HALF_LIFE[tier])) return here
  return here - (here - below) * stalenessRatio(cell, now)
}

/** Minutes until this observation drops to the next tier. */
export function minutesToDecay(cell: Cell, now: number): number | null {
  if (cell.observedAt === null) return null
  const tier = decayed(cell.conf, cell.observedAt, now)
  const life = HALF_LIFE[tier]
  if (!isFinite(life)) return null
  return Math.max(0, Math.round((1 - stalenessRatio(cell, now)) * life))
}

/**
 * Radius, in cells, of the "it could be anywhere in here" ellipse around a unit
 * we have lost contact with. It grows with time since contact, because that is
 * the honest thing to draw. A dark unit is never removed from the map.
 */
export function uncertaintyRadius(robot: Robot, now: number): number {
  if (robot.link === 'live') return 0
  const minutesDark = Math.max(0, now - robot.lastContact)
  const growth = minutesDark * robot.driftRate
  // A patchy link still gives coarse position, so cap it tightly.
  const cap = robot.link === 'degraded' ? 1.2 : 6.5
  return Math.min(cap, growth)
}

export function ageLabel(observedAt: number | null, now: number): string {
  if (observedAt === null) return 'never observed'
  const age = Math.max(0, Math.round(now - observedAt))
  if (age === 0) return 'just now'
  if (age === 1) return 'a minute ago'
  return `${age} minutes ago`
}
