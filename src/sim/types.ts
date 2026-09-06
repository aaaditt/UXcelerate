/**
 * CAIRN mission model.
 *
 * The whole application is a fold over a timestamped event log:
 *
 *     state(T) = log.filter(e => e.known <= T)
 *                   .sort(by t)
 *                   .reduce(applyEvent, seed)
 *
 * Every event carries TWO clocks and the distinction is the point:
 *
 *   t      — when the thing actually happened in the world
 *   known  — when Command learned about it
 *
 * For a live robot they are equal. For a robot that went dark at T+08 and
 * reconnected at T+11, `t` stays in the past while `known` jumps forward:
 * the observation is delivered late and arrives ALREADY STALE. That is what
 * store-and-forward really does, and it is why the map in this app can gain
 * information about its own past instead of only its present.
 */

// ---------------------------------------------------------------- geography

/** How much we trust a fact. Rendered as texture, never as colour alone. */
export type Confidence = 'confirmed' | 'reported' | 'inferred' | 'unknown'

export const CONFIDENCE_ORDER: Confidence[] = ['confirmed', 'reported', 'inferred', 'unknown']

export type CellKind = 'street' | 'block' | 'rubble' | 'plaza'

export interface Cell {
  x: number
  y: number
  kind: CellKind
  /** Can a ground unit traverse it, as far as we currently believe. */
  passable: boolean
  conf: Confidence
  /** Mission-minute the observation was MADE (not when it arrived). */
  observedAt: number | null
  observedBy: string | null
}

// ------------------------------------------------------------------- robots

export type RobotClass = 'aerial' | 'ground' | 'crawler' | 'quadruped'

/**
 * Link state is deliberately four-valued. A binary online/offline flag is the
 * single most common lie in fleet UIs: it makes a robot vanish, and a commander
 * who cannot see a unit re-tasks its sector and duplicates a search.
 */
export type LinkState = 'live' | 'degraded' | 'dark' | 'lost'

export interface Order {
  id: string
  issuedAt: number
  /** null until the robot actually hears it. */
  acknowledgedAt: number | null
  summary: string
  targetId: string | null
}

export interface Robot {
  id: string
  name: string
  cls: RobotClass
  x: number
  y: number
  link: LinkState
  /** Mission-minute of last confirmed contact. Drives the uncertainty ellipse. */
  lastContact: number
  battery: number
  /** Metres/min of drift used to size the uncertainty ellipse while dark. */
  driftRate: number
  orders: Order[]
  sensor: string
}

// ---------------------------------------------------------------- survivors

export type SignalKind = 'audio' | 'thermal' | 'co2' | 'motion' | 'radar'

export type SurvivorStatus = 'candidate' | 'triaged' | 'assigned' | 'reached'

export interface Survivor {
  id: string
  label: string
  x: number
  y: number
  detectedAt: number
  detectedBy: string
  signals: SignalKind[]
  /** 0..1 — how sure we are a person is actually there. */
  vitalsConfidence: number
  /** Estimated void volume; larger void = better survival odds. */
  voidSpace: 'none' | 'tight' | 'moderate' | 'good'
  status: SurvivorStatus
  assignedTo: string | null
  note: string
}

// ------------------------------------------------------------------ hazards

export type HazardKind = 'gas' | 'fire' | 'collapse' | 'water' | 'electrical'

export interface Hazard {
  id: string
  kind: HazardKind
  x: number
  y: number
  radius: number
  severity: 'watch' | 'serious' | 'critical'
  observedAt: number
  observedBy: string
  note: string
}

// ---------------------------------------------------------- contested facts

export interface Claim {
  by: string
  sensor: string
  /** Mission-minute the claim was made. */
  at: number
  passable: boolean
  text: string
}

/**
 * Two units reported incompatible things about the same ground.
 * The system refuses to silently pick a winner — a commander adjudicates,
 * and the adjudication is logged with its consequence.
 */
export interface ContestedFact {
  id: string
  subject: string
  cells: Array<[number, number]>
  claimA: Claim
  claimB: Claim
  raisedAt: number
  resolution: 'a' | 'b' | 'verify' | null
  resolvedAt: number | null
  /**
   * Who settled it. A commander adjudication names the commander; a physical
   * traversal names the unit, because evidence outranks a judgement call.
   */
  resolvedBy: 'command' | string | null
}

// ------------------------------------------------------------------- events

export type MissionEvent =
  | { id: string; t: number; known: number; kind: 'observe'; by: string; conf: Confidence; cells: Array<{ x: number; y: number; passable: boolean; kind?: CellKind }> }
  | { id: string; t: number; known: number; kind: 'move'; robot: string; x: number; y: number }
  | { id: string; t: number; known: number; kind: 'link'; robot: string; link: LinkState }
  | { id: string; t: number; known: number; kind: 'survivor'; survivor: Survivor }
  | { id: string; t: number; known: number; kind: 'hazard'; hazard: Hazard }
  | { id: string; t: number; known: number; kind: 'contest'; fact: ContestedFact }
  | { id: string; t: number; known: number; kind: 'aftershock'; magnitude: number; cells: Array<[number, number]> }
  | { id: string; t: number; known: number; kind: 'log'; text: string; tone: 'info' | 'warn' | 'good' }

export interface LogLine {
  t: number
  known: number
  text: string
  tone: 'info' | 'warn' | 'good'
  /** True when the entry arrived later than it occurred (store-and-forward). */
  backfilled: boolean
}

// -------------------------------------------------------------------- state

export interface MissionState {
  now: number
  grid: Cell[][]
  robots: Robot[]
  survivors: Survivor[]
  hazards: Hazard[]
  contests: ContestedFact[]
  log: LogLine[]
}

export interface Beat {
  t: number
  key: string
  title: string
  blurb: string
}
