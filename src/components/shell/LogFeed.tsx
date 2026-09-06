import { useMission } from '../../state/MissionProvider'
import { Empty, Panel } from './ui'

/**
 * The log reads in ARRIVAL order, not occurrence order, because that is the
 * order a commander actually experienced the incident. Anything delivered late
 * is stamped with both clocks, so nobody can later claim Command knew something
 * at the moment it happened.
 */
export function LogFeed() {
  const { state } = useMission()

  const tone = {
    info: '#b7ada0',
    warn: '#dc9a3f',
    good: '#62ab82',
  }

  return (
    <Panel title="Comms log" count={`${state.log.length}`}>
      {state.log.length === 0 ? (
        <Empty>Nothing received yet.</Empty>
      ) : (
        <ol>
          {state.log.map((l, i) => (
            <li key={i} className="border-b border-[#2c2723] px-3 py-2">
              <div className="flex items-baseline gap-2">
                <span className="tnum shrink-0 font-mono text-[10px] text-[#9a8f80]">
                  T+{l.known.toFixed(1)}
                </span>
                {l.backfilled && (
                  <span className="tnum shrink-0 border border-[#dc9a3f]/50 px-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#dc9a3f]">
                    occurred T+{l.t.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: tone[l.tone] }}>
                {l.text}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
