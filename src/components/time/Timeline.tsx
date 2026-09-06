import { BEATS, T_MAX } from '../../sim/script'
import { useMission } from '../../state/MissionProvider'

/**
 * The mission clock is a scrubber because the state is a fold over an event
 * log — "what did we know at four minutes" is the same query as "what do we
 * know now" with a different bound. Judges get a demo that runs itself;
 * operators get the ability to rewind an argument about who knew what, when.
 *
 * The beats are numbered because they genuinely are a sequence: this is a
 * timeline, and T+4 really does come after T+2.
 */
export function Timeline() {
  const { now, setNow, playing, setPlaying } = useMission()
  const current = [...BEATS].reverse().find((b) => now >= b.t) ?? BEATS[0]
  const done = now >= T_MAX

  return (
    <div className="shrink-0 border-t border-[#2b2620] bg-[#17140f] px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (done) setNow(0)
            setPlaying(!playing)
          }}
          className="w-[74px] shrink-0 border border-[#3a342c] px-2 py-1.5 text-[12.5px] text-[#e8e1d6] transition-colors hover:border-[#554d43] hover:bg-[#201c17]"
        >
          {playing ? 'Pause' : done ? 'Replay' : 'Play'}
        </button>

        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={T_MAX}
            step={0.05}
            value={now}
            onChange={(e) => {
              setPlaying(false)
              setNow(Number(e.target.value))
            }}
            aria-label="Scrub the mission timeline"
            className="w-full"
          />
          <div className="pointer-events-none absolute inset-x-0 top-full h-2">
            {BEATS.map((b) => (
              <span
                key={b.key}
                className="absolute h-1.5 w-px bg-[#554d43]"
                style={{ left: `${(b.t / T_MAX) * 100}%` }}
              />
            ))}
          </div>
        </div>

        <span className="tnum w-20 shrink-0 text-right font-mono text-[12px] text-[#9a8f80]">
          {now.toFixed(1)} min
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {BEATS.map((b) => {
          const active = current.key === b.key
          return (
            <button
              key={b.key}
              onClick={() => {
                setPlaying(false)
                setNow(b.t)
              }}
              className={`flex items-baseline gap-1.5 border px-2 py-1.5 text-[12px] transition-colors ${
                active
                  ? 'border-[#f4efe7] bg-[#f4efe7] font-medium text-[#17140f]'
                  : 'border-[#3a342c] text-[#b9af9f] hover:border-[#554d43] hover:bg-[#201c17]'
              }`}
            >
              <span className="tnum font-mono text-[10.5px] opacity-65">{b.t}m</span>
              {b.title}
            </button>
          )
        })}
      </div>

      <p className="mt-2.5 max-w-4xl text-[12.5px] leading-relaxed text-[#9a8f80]">
        {current.blurb}
      </p>
    </div>
  )
}
