import { ageLabel } from '../../sim/decay'
import type { TriageEntry } from '../../sim/scoring'
import { useMission } from '../../state/MissionProvider'
import { Button, Empty, Meter, Panel, Tag } from '../shell/ui'

/**
 * Triage, not notifications.
 *
 * Discoveries arrive here as CANDIDATES that must be triaged in — they never
 * appear as a toast that steals focus and then disappears with the only copy
 * of the information. The ranking shows its arithmetic, because a commander
 * cannot act on a number they do not believe, and it shows what would change
 * it, because that is what turns an argument about a street into a decision
 * about a person.
 */

function Row({ entry, index }: { entry: TriageEntry; index: number }) {
  const { selectedSurvivor, setSelectedSurvivor, assign, state } = useMission()
  const s = entry.survivor
  const open = selectedSurvivor === s.id
  const isTop = index === 0

  const candidate = s.status === 'candidate'

  return (
    <article className={`border-b border-[#2c2723] ${open ? 'bg-[#1b1714]' : ''}`}>
      <button
        onClick={() => setSelectedSurvivor(open ? null : s.id)}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[#1b1714]"
        aria-expanded={open}
      >
        <span
          className="tnum mt-px flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[12px] font-bold"
          style={{
            borderColor: isTop ? '#e0565c' : '#3a342e',
            color: isTop ? '#e0565c' : '#b7ada0',
          }}
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[#f2ede6]">{s.label}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {candidate && <Tag tone="warn">Candidate</Tag>}
            {s.status === 'assigned' && <Tag tone="good">Assigned</Tag>}
            {!entry.route.reachable && <Tag tone="bad">No route</Tag>}
            <span className="tnum font-mono text-[10px] text-[#9a8f80]">
              {s.detectedBy} · {ageLabel(s.detectedAt, state.now)}
            </span>
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-3 px-3 pb-3">
          <p className="text-[12px] leading-relaxed text-[#b7ada0]">{s.note}</p>

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80]">
              Why this rank
            </p>
            {entry.factors.map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] text-[#e8e1d8]">{f.label}</span>
                  <span className="tnum font-mono text-[11px] text-[#9a8f80]">
                    {Math.round(f.value * 100)}%
                  </span>
                </div>
                <Meter value={f.value} tone={f.value < 0.4 ? 'bad' : f.value < 0.7 ? 'warn' : 'neutral'} />
                <p className="text-[11px] leading-snug text-[#9a8f80]">{f.detail}</p>
              </div>
            ))}
          </div>

          {entry.counterfactual && (
            <div className="border-l-2 border-[#dc9a3f] bg-[#dc9a3f]/6 py-1.5 pl-2.5">
              <p className="text-[12px] leading-snug text-[#dc9a3f]">
                {entry.counterfactual.text}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9a8f80]">
                Resolving that contested fact changes who we reach first.
              </p>
            </div>
          )}

          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80]">
              Dispatch
            </p>
            <div className="flex flex-wrap gap-1.5">
              {state.robots
                .filter((r) => r.cls !== 'aerial')
                .map((r) => {
                  const unheard = r.link === 'dark' || r.link === 'lost'
                  return (
                    <Button
                      key={r.id}
                      variant={s.assignedTo === r.id ? 'solid' : 'ghost'}
                      onClick={() => assign(s.id, r.id)}
                    >
                      <span className="font-mono text-[11px]">{r.name}</span>
                      {unheard && <span className="ml-1 text-[10px] text-[#dc9a3f]">· dark</span>}
                    </Button>
                  )
                })}
            </div>
            {s.assignedTo &&
              state.robots.find((r) => r.id === s.assignedTo)?.link === 'dark' && (
                <p className="mt-1.5 text-[11px] leading-snug text-[#dc9a3f]">
                  Order queued. This unit cannot hear us yet — it will be delivered on next contact.
                </p>
              )}
          </div>
        </div>
      )}
    </article>
  )
}

export function TriagePanel() {
  const { entries } = useMission()
  return (
    <Panel title="Triage" count={`${entries.length} located`}>
      {entries.length === 0 ? (
        <Empty>No life signals yet. The swarm is still building a picture.</Empty>
      ) : (
        entries.map((e, i) => <Row key={e.survivor.id} entry={e} index={i} />)
      )}
    </Panel>
  )
}
