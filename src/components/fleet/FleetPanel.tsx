import { ageLabel, uncertaintyRadius } from '../../sim/decay'
import type { LinkState, Robot } from '../../sim/types'
import { useMission } from '../../state/MissionProvider'
import { Panel, Tag } from '../shell/ui'

/**
 * The fleet, with an honest link model.
 *
 * A binary online/offline flag is the most common lie in fleet software: it
 * makes a unit vanish, and a commander who cannot see a unit re-tasks its
 * sector and duplicates a search that is already underway. So a dark unit stays
 * on this list and on the map, with its position uncertainty stated in plain
 * language and its unheard orders counted.
 */

const LINK_COPY: Record<LinkState, { label: string; tone: 'neutral' | 'warn' | 'bad' | 'good' }> = {
  live: { label: 'Live', tone: 'good' },
  degraded: { label: 'Degraded', tone: 'warn' },
  dark: { label: 'Dark', tone: 'bad' },
  lost: { label: 'Lost', tone: 'bad' },
}

const CLASS_COPY: Record<Robot['cls'], string> = {
  aerial: 'Aerial scout',
  ground: 'Tracked rover',
  crawler: 'Crawler',
  quadruped: 'Quadruped',
}

function Unit({ r }: { r: Robot }) {
  const { state, selectedRobot, setSelectedRobot } = useMission()
  const open = selectedRobot === r.id
  const link = LINK_COPY[r.link]
  const unheard = r.orders.filter((o) => o.acknowledgedAt === null)
  const radius = uncertaintyRadius(r, state.now)

  return (
    <article className={`border-b border-[#2c2723] ${open ? 'bg-[#1b1714]' : ''}`}>
      <button
        onClick={() => setSelectedRobot(open ? null : r.id)}
        className="w-full px-3 py-2.5 text-left hover:bg-[#1b1714]"
        aria-expanded={open}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[12px] font-semibold text-[#f2ede6]">{r.name}</span>
          <Tag tone={link.tone}>{link.label}</Tag>
        </span>
        <span className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-[#857b6f]">{CLASS_COPY[r.cls]}</span>
          <span className="tnum font-mono text-[10px] text-[#857b6f]">{r.battery}%</span>
        </span>
        {unheard.length > 0 && (
          <span className="mt-1.5 block text-[11px] leading-snug text-[#dc9a3f]">
            {unheard.length} order{unheard.length === 1 ? '' : 's'} this unit does not know about yet
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-2 px-3 pb-3 text-[11px] leading-relaxed text-[#857b6f]">
          <p>{r.sensor}</p>
          <p>
            Last contact {ageLabel(r.lastContact, state.now)}
            {radius > 0.05 && (
              <>
                {' '}
                — true position could be anywhere within{' '}
                <span className="tnum text-[#dc9a3f]">{radius.toFixed(1)} cells</span> of the marker.
              </>
            )}
          </p>
          {r.orders.length > 0 && (
            <div className="space-y-1">
              {r.orders.map((o) => (
                <p key={o.id} className="flex items-baseline gap-1.5">
                  <span className={o.acknowledgedAt === null ? 'text-[#dc9a3f]' : 'text-[#62ab82]'}>
                    {o.acknowledgedAt === null ? 'QUEUED' : 'ACK'}
                  </span>
                  <span className="text-[#b7ada0]">{o.summary}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export function FleetPanel() {
  const { state } = useMission()
  const dark = state.robots.filter((r) => r.link === 'dark').length
  return (
    <Panel title="Fleet" count={dark > 0 ? `${dark} dark` : `${state.robots.length} on net`}>
      {state.robots.map((r) => (
        <Unit key={r.id} r={r} />
      ))}
    </Panel>
  )
}
