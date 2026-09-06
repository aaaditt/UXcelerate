import type { Claim, ContestedFact } from '../../sim/types'
import { useMission } from '../../state/MissionProvider'
import { Button, Empty, Panel, Tag } from '../shell/ui'

/**
 * Contested facts.
 *
 * When two units report incompatible things about the same ground, most fleet
 * software silently prefers the newer reading, or the higher-ranked sensor, and
 * shows a single confident answer. That is the failure that gets rescuers hurt:
 * the interface projects certainty it does not have.
 *
 * CAIRN raises the disagreement instead, attributes both claims, and shows what
 * each choice costs in triage order — then records who decided and when.
 */

function ClaimBlock({ claim, label }: { claim: Claim; label: string }) {
  return (
    <div className="border border-[#3a342e] p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-[#f2ede6]">{claim.by}</span>
        <span className="tnum font-mono text-[10px] text-[#9a8f80]">T+{claim.at.toFixed(1)}</span>
      </div>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#9a8f80]">
        {claim.sensor}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#b7ada0]">{claim.text}</p>
      <p className="mt-1.5">
        <Tag tone={claim.passable ? 'good' : 'bad'}>
          {label}: {claim.passable ? 'passable' : 'blocked'}
        </Tag>
      </p>
    </div>
  )
}

function Fact({ fact }: { fact: ContestedFact }) {
  const { adjudicate, entries } = useMission()

  const affected = entries.filter((e) => e.counterfactual?.contestId === fact.id)

  if (fact.resolution) {
    const chosen =
      fact.resolution === 'a' ? fact.claimA.by : fact.resolution === 'b' ? fact.claimB.by : null
    const byEvidence = !!fact.resolvedBy && fact.resolvedBy !== 'command'
    return (
      <article className="border-b border-[#2c2723] px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[12px] font-medium text-[#f2ede6]">{fact.subject}</p>
          <Tag tone={byEvidence ? 'good' : 'neutral'}>
            {byEvidence ? 'Settled by evidence' : 'Adjudicated'}
          </Tag>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-[#62ab82]">
          {fact.resolution === 'verify'
            ? 'Verification tasked — treated as blocked until a unit physically confirms.'
            : byEvidence
              ? `${fact.resolvedBy} physically traversed this ground at T+${fact.resolvedAt?.toFixed(1)}, which settles it in favour of ${chosen}. Evidence outranks a judgement call.`
              : `Command adjudicated in favour of ${chosen} at T+${fact.resolvedAt?.toFixed(1)}.`}
        </p>
      </article>
    )
  }

  return (
    <article className="space-y-2.5 border-b border-[#2c2723] px-3 py-3">
      <div>
        <p className="text-[13px] font-medium text-[#f2ede6]">{fact.subject}</p>
        <p className="mt-0.5 text-[11px] text-[#9a8f80]">
          Two units, two incompatible readings. Command must decide what to believe.
        </p>
      </div>

      <ClaimBlock claim={fact.claimA} label="Claim A" />
      <ClaimBlock claim={fact.claimB} label="Claim B" />

      {affected.length > 0 && (
        <div className="border-l-2 border-[#dc9a3f] py-1.5 pl-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80]">
            Consequence
          </p>
          {affected.map((e) => (
            <p key={e.survivor.id} className="mt-1 text-[12px] leading-snug text-[#dc9a3f]">
              {e.survivor.label} — {e.counterfactual?.text}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button onClick={() => adjudicate(fact.id, 'a')}>Trust {fact.claimA.by}</Button>
        <Button onClick={() => adjudicate(fact.id, 'b')}>Trust {fact.claimB.by}</Button>
        <Button variant="solid" onClick={() => adjudicate(fact.id, 'verify')}>
          Send a unit to verify
        </Button>
      </div>
      <p className="text-[11px] leading-snug text-[#9a8f80]">
        Verifying costs time but buys a confirmed fact. Until then this ground stays impassable in
        every route we calculate.
      </p>
    </article>
  )
}

export function ContestPanel() {
  const { state } = useMission()
  const open = state.contests.filter((c) => !c.resolution)
  return (
    <Panel title="Contested facts" count={open.length > 0 ? `${open.length} open` : 'none open'}>
      {state.contests.length === 0 ? (
        <Empty>
          No disagreements on record. When two units contradict each other, the argument surfaces
          here rather than being silently resolved.
        </Empty>
      ) : (
        state.contests.map((f) => <Fact key={f.id} fact={f} />)
      )}
    </Panel>
  )
}
