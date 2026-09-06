import { useMemo } from 'react'
import { stateAt } from '../sim/reducer'
import { GRID_H, GRID_W } from '../sim/seed'

/**
 * The briefing.
 *
 * A command deck opened cold is unreadable — a judge sees panels and a dark
 * map and has to guess what the idea was. So the entry screen states the idea
 * first, and uses the strongest thing the product can show as its hero.
 *
 * That hero is not a decorative render. It is the real mission state folded to
 * eleven minutes and drawn as information age: every patch of ground six units
 * have actually seen, and nothing else. The emptiness is the argument.
 */

const CELL = 8

function ageFill(minutes: number | null): string {
  if (minutes === null) return '#131110'
  if (minutes < 2) return '#efe0bd'
  if (minutes < 5) return '#c0a888'
  if (minutes < 10) return '#8d745b'
  if (minutes < 20) return '#5e4c3e'
  return '#3a2f28'
}

function SeenSoFar() {
  // Folded once at module render, not animated: this is a still, and a still
  // makes the point harder than motion would.
  const grid = useMemo(() => stateAt(11).grid, [])
  const W = GRID_W * CELL
  const H = GRID_H * CELL

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Everything six robots have observed after eleven minutes: a few scattered patches in an otherwise unseen district."
    >
      <rect width={W} height={H} fill="#0f0d0b" />
      {grid.map((row) =>
        row.map((c) => (
          <rect
            key={`${c.x},${c.y}`}
            x={c.x * CELL}
            y={c.y * CELL}
            width={CELL}
            height={CELL}
            fill={ageFill(c.observedAt === null ? null : 11 - c.observedAt)}
          />
        )),
      )}
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="#3a342c" />
    </svg>
  )
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#2b2620] pt-3.5">
      <h2 className="text-[13.5px] font-semibold text-[#f4efe7]">{title}</h2>
      <p className="mt-1.5 text-[13px] leading-[1.7] text-[#9a8f80]">{children}</p>
    </div>
  )
}

export function Briefing({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="min-h-full overflow-y-auto bg-[#0f0d0b]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:py-20">
        <div className="max-w-xl">
          <p className="text-[15px] font-semibold tracking-[0.3em] text-[#f4efe7]">CAIRN</p>

          <h1 className="mt-6 text-[34px] font-semibold leading-[1.15] text-[#f4efe7] sm:text-[42px]">
            Command a rescue swarm through a city you cannot see.
          </h1>

          <p className="mt-5 text-[15px] leading-[1.75] text-[#b9af9f]">
            Forty-seven minutes after a magnitude 7.2 earthquake, six robots are working a
            collapsed district. The map is mostly a guess, the radio keeps dropping, and the units
            keep finding things that contradict each other.
          </p>

          <p className="mt-4 text-[15px] leading-[1.75] text-[#b9af9f]">
            Your job is not to drive the robots. It is to decide{' '}
            <span className="text-[#f4efe7]">what to believe</span>, and{' '}
            <span className="text-[#f4efe7]">where to spend time you do not have</span>.
          </p>

          <button
            onClick={onEnter}
            className="mt-8 bg-[#f4efe7] px-5 py-3 text-[14px] font-medium text-[#17140f] transition-colors hover:bg-white"
          >
            Open the command deck
          </button>

          <p className="mt-3 text-[12.5px] text-[#9a8f80]">
            The incident plays itself, about thirty seconds end to end. Nothing to set up.
          </p>
        </div>

        <div>
          <SeenSoFar />
          <p className="mt-4 text-[13px] leading-[1.7] text-[#9a8f80]">
            <span className="text-[#e8e1d6]">
              This is everything the swarm has seen after eleven minutes.
            </span>{' '}
            Bright ground was observed seconds ago, dim ground minutes ago, black ground never.
            Four fifths of this district has never been looked at by anything. An interface that
            draws that part as though it were known is lying to the person who has to walk into
            it.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <Point title="The map forgets">
            Ground nobody re-checks fades from confirmed to reported to guesswork on its own, and an
            aftershock demotes the whole district at once. Certainty is a function of age, not a
            flag somebody set.
          </Point>
          <Point title="Two robots disagree">
            When the drone says a street is clear and the rover says it is blocked, nothing quietly
            picks a winner. The dispute is raised, both claims are attributed, and you are shown
            what each answer costs in lives reached.
          </Point>
          <Point title="A robot goes silent">
            It is never deleted from the map. It holds its last known position inside a circle that
            grows while contact ages, orders queue instead of failing, and when it returns it hands
            over three minutes of the past that changes what you thought you knew.
          </Point>
        </div>

        <p className="mt-10 max-w-3xl text-[13px] leading-[1.7] text-[#6f665b]">
          Built for the IEI BPDC UXcelerate! challenge, 5&ndash;6 September 2026. No map vendor and
          no 3D: the whole district is hand-drawn SVG over a deterministic simulation, because a
          photographic basemap would assert that the city is known — which is the one thing the
          brief says is not true.
        </p>
      </div>
    </main>
  )
}
