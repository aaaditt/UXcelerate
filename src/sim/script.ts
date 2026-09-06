import type { Beat, Confidence, MissionEvent, SignalKind } from './types'

/**
 * The scripted incident.
 *
 * Judges will not explore an unfamiliar command interface, so the incident
 * plays itself. Six named beats, each demonstrating exactly one hard part of
 * the brief, each jumpable from the timeline.
 *
 * Remember the two clocks: `t` is when it happened, `known` is when Command
 * learned it. Everything MOLE-6 sees between T+08 and T+11 is stamped in the
 * past but delivered at T+11 — that is the store-and-forward burst, and it is
 * why the map can gain information about its own history.
 */

let seq = 0
const nid = () => `e${++seq}`

type Obs = { x: number; y: number; passable: boolean }

/** A rectangle of cells taken in one sweep. */
function rect(x0: number, y0: number, x1: number, y1: number, passable = true): Obs[] {
  const out: Obs[] = []
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push({ x, y, passable })
  return out
}

function observe(t: number, by: string, conf: Confidence, cells: Obs[], known = t): MissionEvent {
  return { id: nid(), t, known, kind: 'observe', by, conf, cells }
}

function move(t: number, robot: string, x: number, y: number, known = t): MissionEvent {
  return { id: nid(), t, known, kind: 'move', robot, x, y }
}

function log(
  t: number,
  text: string,
  tone: 'info' | 'warn' | 'good' = 'info',
  known = t,
): MissionEvent {
  return { id: nid(), t, known, kind: 'log', text, tone }
}

interface SurvivorSpec {
  id: string
  label: string
  x: number
  y: number
  by: string
  signals: SignalKind[]
  vitals: number
  voidSpace: 'none' | 'tight' | 'moderate' | 'good'
  note: string
}

function survivor(t: number, s: SurvivorSpec, known = t): MissionEvent {
  return {
    id: nid(),
    t,
    known,
    kind: 'survivor',
    survivor: {
      id: s.id,
      label: s.label,
      x: s.x,
      y: s.y,
      detectedAt: t,
      detectedBy: s.by,
      signals: s.signals,
      vitalsConfidence: s.vitals,
      voidSpace: s.voidSpace,
      status: 'candidate',
      assignedTo: null,
      note: s.note,
    },
  }
}

export const EVENTS: MissionEvent[] = [
  // ── T+00 · BASELINE ───────────────────────────────────────────────────
  log(0, 'Command deck online. Six units on the net. In places this picture is 47 minutes old.', 'info'),
  observe(0, 'VULCAN-4', 'confirmed', rect(1, 5, 6, 5)),
  observe(0, 'SKYEYE-1', 'reported', rect(7, 1, 13, 6)),
  survivor(0, {
    id: 's1',
    label: 'ALMEIDA 14 — stairwell void',
    x: 5,
    y: 6,
    by: 'VULCAN-4',
    signals: ['audio', 'co2'],
    vitals: 0.82,
    voidSpace: 'moderate',
    note: 'Tapping on a 4-count. Responsive to voice. CO2 gradient consistent with one adult.',
  }),
  {
    id: nid(),
    t: 0,
    known: 0,
    kind: 'hazard',
    hazard: {
      id: 'h1',
      kind: 'gas',
      x: 10,
      y: 4,
      radius: 2.4,
      severity: 'serious',
      observedAt: 0,
      observedBy: 'VULCAN-4',
      note: 'Ruptured LPG riser. No ignition source identified yet.',
    },
  },

  // ── T+02 · LIFE SIGNAL OVER BLOCK C ───────────────────────────────────
  move(1.4, 'skyeye', 15, 5),
  observe(1.6, 'SKYEYE-1', 'reported', rect(14, 3, 19, 8)),
  log(2, 'SKYEYE-1 thermal return over Block C. Raised as a triage candidate — not verified.', 'warn'),
  survivor(2, {
    id: 's2',
    label: 'BLOCK C — floor 3 slab void',
    x: 17,
    y: 6,
    by: 'SKYEYE-1',
    signals: ['thermal'],
    vitals: 0.41,
    voidSpace: 'tight',
    note: 'One thermal bloom through a slab gap. No audio. Could be a person; could be a hot transformer.',
  }),
  move(2.4, 'titan', 15, 8),

  // ── T+04 · CONTESTED GROUND ───────────────────────────────────────────
  observe(3.2, 'SKYEYE-1', 'reported', rect(12, 9, 18, 9)),
  {
    id: nid(),
    t: 4,
    known: 4,
    kind: 'contest',
    fact: {
      id: 'c1',
      subject: 'ALMEIDA ST — east approach',
      cells: [
        [12, 9],
        [13, 9],
        [14, 9],
        [15, 9],
        [16, 9],
        [17, 9],
        [18, 9],
      ],
      raisedAt: 4,
      claimA: {
        by: 'SKYEYE-1',
        sensor: 'EO/IR from 60 m',
        at: 3.2,
        passable: true,
        text: 'Carriageway reads clear end to end. No debris shadow on the deck.',
      },
      claimB: {
        by: 'TITAN-2',
        sensor: 'ground radar at 4 m',
        at: 3.8,
        passable: false,
        text: 'Facade collapse across the eastern third. An overhead view cannot see under the awning line.',
      },
      resolution: null,
      resolvedAt: null,
      resolvedBy: null,
    },
  },
  log(4, 'CONTESTED: SKYEYE-1 and TITAN-2 disagree about Almeida St. Adjudication required.', 'warn'),

  // ── T+05 · CARPARK RAMP ───────────────────────────────────────────────
  move(4.6, 'gecko', 26, 6),
  observe(4.8, 'GECKO-8', 'confirmed', rect(24, 2, 28, 6)),
  survivor(5, {
    id: 's3',
    label: 'CARPARK RAMP — level B1',
    x: 26,
    y: 5,
    by: 'GECKO-8',
    signals: ['audio', 'motion'],
    vitals: 0.74,
    voidSpace: 'good',
    note: 'Two voices. Ramp deck intact above them. Reachable without shoring.',
  }),

  // ── T+06 · AFTERSHOCK ─────────────────────────────────────────────────
  {
    id: nid(),
    t: 6,
    known: 6,
    kind: 'aftershock',
    magnitude: 4.6,
    cells: [
      [7, 5],
      [8, 5],
      [9, 5],
      [12, 9],
      [13, 9],
      [14, 9],
      [15, 4],
      [16, 4],
      [20, 11],
      [21, 11],
      [22, 11],
    ],
  },
  log(6, 'AFTERSHOCK M4.6. Verified ground is a claim again — confirmed cells demoted across the district.', 'warn'),
  {
    id: nid(),
    t: 6.2,
    known: 6.2,
    kind: 'hazard',
    hazard: {
      id: 'h2',
      kind: 'collapse',
      x: 14,
      y: 9,
      radius: 1.8,
      severity: 'critical',
      observedAt: 6.2,
      observedBy: 'TITAN-2',
      note: 'Secondary facade failure triggered by the aftershock.',
    },
  },

  // ── T+08 · MESH FAILURE ───────────────────────────────────────────────
  move(7.2, 'mole', 21, 12),
  { id: nid(), t: 8, known: 8, kind: 'link', robot: 'mole', link: 'dark' },
  { id: nid(), t: 8.1, known: 8.1, kind: 'link', robot: 'serpens', link: 'dark' },
  log(8, 'Mesh partition. MOLE-6 and SERPENS-3 are dark. Last-known positions held — units are never deleted.', 'warn'),

  // ── T+08 → T+11 · WHAT MOLE SAW WHILE DARK (delivered late) ───────────
  // `t` stays in the past, `known` jumps to 11. These arrive already stale.
  observe(8.6, 'MOLE-6', 'confirmed', rect(19, 12, 23, 14), 11),
  move(9.0, 'mole', 23, 13, 11),
  observe(9.4, 'MOLE-6', 'confirmed', rect(12, 9, 18, 9, false), 11),
  survivor(
    9.2,
    {
      id: 's4',
      label: 'METRO CONCOURSE — north headwall',
      x: 22,
      y: 14,
      by: 'MOLE-6',
      signals: ['audio', 'co2', 'radar'],
      vitals: 0.9,
      voidSpace: 'good',
      note: 'Four survivors sheltering in the ticket hall. Deliberate rhythmic knocking. Air is moving.',
    },
    11,
  ),
  log(
    9.2,
    'MOLE-6 logged four survivors at the metro headwall. Command did not receive this for 108 seconds.',
    'good',
    11,
  ),

  // ── T+11 · RECONNECT · STORE-AND-FORWARD ──────────────────────────────
  { id: nid(), t: 11, known: 11, kind: 'link', robot: 'mole', link: 'live' },
  log(11, 'MOLE-6 back on the net. Burst delivery: three minutes of observations, all arriving stale.', 'good'),
  log(11.1, 'Backfill settles ALMEIDA ST — MOLE-6 physically drove the eastern third. It is blocked.', 'good'),

  // ── T+13 · THE PICTURE KEEPS ROTTING ──────────────────────────────────
  { id: nid(), t: 12.4, known: 12.4, kind: 'link', robot: 'serpens', link: 'degraded' },
  observe(12.6, 'VULCAN-4', 'confirmed', rect(1, 6, 5, 9)),
  survivor(13, {
    id: 's5',
    label: 'ALMEIDA 9 — rear light-well',
    x: 4,
    y: 8,
    by: 'VULCAN-4',
    signals: ['thermal'],
    vitals: 0.28,
    voidSpace: 'none',
    note: 'Weak and intermittent. No void space measured. A candidate, not a commitment.',
  }),
  log(13.4, 'The picture is degrading faster than six units can refresh it. Prioritise or lose the north sector.', 'warn'),
]

export const BEATS: Beat[] = [
  {
    t: 0,
    key: 'baseline',
    title: 'Baseline',
    blurb: 'Six units, and a city we have mostly not seen. Most of this map is a pre-quake guess.',
  },
  {
    t: 2,
    key: 'signal',
    title: 'Life signal',
    blurb: 'A thermal bloom over Block C enters triage as a candidate — not as a notification that vanishes.',
  },
  {
    t: 4,
    key: 'contest',
    title: 'Contested ground',
    blurb: 'Air says clear. Ground says blocked. The system refuses to pick one for you.',
  },
  {
    t: 6,
    key: 'aftershock',
    title: 'Aftershock',
    blurb: 'M4.6. Confirmed cells are demoted — watch the map forget what it just learned.',
  },
  {
    t: 8,
    key: 'dark',
    title: 'Mesh failure',
    blurb: 'Two units go dark. Their uncertainty grows on screen. Orders queue instead of failing.',
  },
  {
    t: 11,
    key: 'backfill',
    title: 'Store-and-forward',
    blurb: 'MOLE-6 returns carrying three minutes of the past — and it settles the argument.',
  },
]

export const T_MAX = 14
