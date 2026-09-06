import type { Cell, CellKind, MissionState, Robot } from './types'

export const GRID_W = 30
export const GRID_H = 26

/** Mulberry32 — small deterministic PRNG so the incident is identical every run. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Sector 4 of a mid-rise district: a street grid with mid-block courtyards,
 * plus two irregular rubble fields where towers pancaked. Deterministic.
 */
function buildGrid(): Cell[][] {
  const rand = rng(7821)
  const grid: Cell[][] = []

  for (let y = 0; y < GRID_H; y++) {
    const row: Cell[] = []
    for (let x = 0; x < GRID_W; x++) {
      const onAvenue = x % 6 === 0 || x % 6 === 1
      const onStreet = y % 5 === 0
      let kind: CellKind = onAvenue || onStreet ? 'street' : 'block'

      // Two civic plazas break up the grid so it doesn't read as graph paper.
      if ((x >= 13 && x <= 16 && y >= 7 && y <= 9) || (x >= 25 && x <= 27 && y >= 2 && y <= 4)) {
        kind = 'plaza'
      }

      // Collapse fields: the north tower, the metro overbuild, and a southern
      // terrace row nobody has reached yet.
      const nearTower = Math.hypot(x - 9, y - 4) < 3.1
      const nearMetro = Math.hypot(x - 20, y - 12) < 3.6
      const nearTerrace = Math.hypot(x - 11, y - 21) < 4.2
      if ((nearTower || nearMetro || nearTerrace) && rand() > 0.22) kind = 'rubble'

      row.push({
        x,
        y,
        kind,
        passable: kind !== 'rubble' && kind !== 'block',
        // Everything starts as pre-quake municipal data: plausible, unverified.
        conf: 'inferred',
        observedAt: null,
        observedBy: null,
      })
    }
    grid.push(row)
  }

  // Beyond the cordon we have nothing at all — not even a stale blueprint.
  // The whole southern half of the sector is in this category, which is the
  // point: six units cannot see a district, and the map should say so.
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (x > 25 && y > 12) grid[y][x].conf = 'unknown'
      if (y > 17 && (x < 7 || x > 19)) grid[y][x].conf = 'unknown'
      if (y > 21) grid[y][x].conf = 'unknown'
    }
  }

  return grid
}

const robots: Robot[] = [
  { id: 'skyeye', name: 'SKYEYE-1', cls: 'aerial', x: 8, y: 3, link: 'live', lastContact: 0, battery: 71, driftRate: 0.9, orders: [], sensor: 'EO/IR + photogrammetry' },
  { id: 'vulcan', name: 'VULCAN-4', cls: 'quadruped', x: 3, y: 5, link: 'live', lastContact: 0, battery: 88, driftRate: 0.35, orders: [], sensor: 'LiDAR + CO₂ sniffer' },
  { id: 'serpens', name: 'SERPENS-3', cls: 'crawler', x: 19, y: 11, link: 'degraded', lastContact: 0, battery: 54, driftRate: 0.22, orders: [], sensor: 'borescope + audio' },
  { id: 'titan', name: 'TITAN-2', cls: 'ground', x: 13, y: 8, link: 'live', lastContact: 0, battery: 92, driftRate: 0.4, orders: [], sensor: 'thermal + radar' },
  { id: 'gecko', name: 'GECKO-8', cls: 'crawler', x: 25, y: 3, link: 'live', lastContact: 0, battery: 46, driftRate: 0.25, orders: [], sensor: 'wall radar' },
  { id: 'mole', name: 'MOLE-6', cls: 'ground', x: 21, y: 13, link: 'live', lastContact: 0, battery: 63, driftRate: 0.3, orders: [], sensor: 'seismic + audio' },
]

/**
 * What Command knows at T+00: the staging corridor has been walked, the
 * approach has been overflown, everything else is a pre-quake guess.
 */
function seedKnowledge(grid: Cell[][]) {
  const walked: Array<[number, number]> = []
  for (let x = 0; x <= 7; x++) walked.push([x, 5])
  for (let y = 5; y <= 9; y++) walked.push([0, y])
  for (const [x, y] of walked) {
    const c = grid[y]?.[x]
    if (!c) continue
    c.conf = 'confirmed'
    c.observedAt = -6
    c.observedBy = 'VULCAN-4'
  }
  for (let x = 6; x <= 14; x++) {
    for (let y = 1; y <= 6; y++) {
      const c = grid[y]?.[x]
      if (!c || c.conf === 'confirmed') continue
      c.conf = 'reported'
      c.observedAt = -3
      c.observedBy = 'SKYEYE-1'
    }
  }
}

/**
 * Nudge a position onto the nearest cell a ground unit can actually stand on.
 *
 * Without this, a unit whose scripted coordinate lands inside a collapsed block
 * is walled in: every route out is impassable, so it silently drops out of
 * dispatch and every survivor reads "no route". Snapping keeps the fleet
 * self-healing no matter what coordinates the incident script uses.
 */
export function snapToPassable(grid: Cell[][], x: number, y: number): { x: number; y: number } {
  if (grid[y]?.[x]?.passable) return { x, y }
  for (let r = 1; r <= 4; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const nx = x + dx
        const ny = y + dy
        if (grid[ny]?.[nx]?.passable) return { x: nx, y: ny }
      }
    }
  }
  return { x, y }
}

export function seedState(): MissionState {
  const grid = buildGrid()
  seedKnowledge(grid)
  return {
    now: 0,
    grid,
    robots: robots.map((r) => ({ ...r, ...snapToPassable(grid, r.x, r.y), orders: [] })),
    survivors: [],
    hazards: [],
    contests: [],
    log: [],
  }
}

export const INCIDENT = {
  name: 'OP. HALCYON',
  sector: 'SECTOR 4 — ALMEIDA DISTRICT',
  quake: 'M7.2',
  /** Mission clock offset: the quake was 47 minutes before T+00. */
  sinceQuake: 47,
}
