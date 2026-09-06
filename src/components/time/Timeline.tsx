import { BEATS, T_MAX } from '../../sim/script'
import { useMission } from '../../state/MissionProvider'

/**
 * The mission clock is a scrubber because the state is a fold over an event
 * log — "what did we know at T+04" is the same query as "what do we know now",
 * with a different bound. Judges get a self-playing demo; operators get the
 * ability to rewind an argument about who knew what, and when.
 */
export function Timeline() {
  const { now, setNow, playing, setPlaying } = useMission()
  const current = [...BEATS].reverse().find((b) => now >= b.t) ?? BEATS[0]

  return (
    <div className="shrink-0 border-t border-[#2c2723] bg-[#151210] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (now >= T_MAX) setNow(0)
            setPlaying(!playing)
          }}
          className="w-16 shrink-0 border border-[#3a342e] px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#e8e1d8] transition-colors hover:border-[#6b6055] hover:bg-[#211c18]"
          aria-label={playing ? 'Pause the incident' : 'Play the incident'}
        >
          {playing ? 'Pause' : now >= T_MAX ? 'Replay' : 'Play'}
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
            aria-label="Mission timeline"
            className="w-full accent-[#f2ede6]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-full flex">
            {BEATS.map((b) => (
              <span
                key={b.key}
                className="absolute h-2 w-px bg-[#544c43]"
                style={{ left: `${(b.t / T_MAX) * 100}%` }}
              />
            ))}
          </div>
        </div>

        <span className="tnum w-14 shrink-0 text-right font-mono text-[11px] text-[#9a8f80]">
          T+{now.toFixed(1)}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {BEATS.map((b) => {
          const active = current.key === b.key
          return (
            <button
              key={b.key}
              onClick={() => {
                setPlaying(false)
                setNow(b.t)
              }}
              className={`border px-2 py-1 text-[11px] transition-colors ${
                active
                  ? 'border-[#f2ede6] bg-[#f2ede6] text-[#151210]'
                  : 'border-[#3a342e] text-[#b7ada0] hover:border-[#6b6055] hover:bg-[#211c18]'
              }`}
            >
              <span className="tnum font-mono text-[10px] opacity-70">T+{b.t}</span>{' '}
              {b.title}
            </button>
          )
        })}
      </div>

      <p className="mt-2 max-w-4xl text-[12px] leading-relaxed text-[#9a8f80]">{current.blurb}</p>
    </div>
  )
}
