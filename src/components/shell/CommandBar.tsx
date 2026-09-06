import { INCIDENT } from '../../sim/seed'
import { useMission } from '../../state/MissionProvider'

function clock(minutes: number, offset: number) {
  const total = minutes + offset
  const h = Math.floor(total / 60)
  const m = Math.floor(total % 60)
  const s = Math.floor((total % 1) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Stat({
  label,
  value,
  tone,
  className = '',
}: {
  label: string
  value: string
  tone?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-0.5 border-l border-[#2c2723] px-3 first:border-l-0 ${className}`}>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#9a8f80]">{label}</span>
      <span className="tnum text-[13px] font-semibold" style={{ color: tone ?? '#f2ede6' }}>
        {value}
      </span>
    </div>
  )
}

export function CommandBar({ onOpenProcess }: { onOpenProcess: () => void }) {
  const { state, cover, entries } = useMission()

  const dark = state.robots.filter((r) => r.link === 'dark' || r.link === 'lost').length
  const open = state.contests.filter((c) => !c.resolution).length
  const queued = state.robots.reduce(
    (n, r) => n + r.orders.filter((o) => o.acknowledgedAt === null).length,
    0,
  )

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-y-2 border-b border-[#2c2723] bg-[#151210] px-4 py-2.5">
      <div className="mr-5 flex items-baseline gap-3">
        <span className="text-[15px] font-semibold tracking-[0.2em]">CAIRN</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80] sm:inline">
          {INCIDENT.name} · {INCIDENT.sector}
        </span>
      </div>

      <div className="flex flex-1 flex-wrap items-center">
        <Stat label="Since quake" value={clock(state.now, INCIDENT.sinceQuake)} />
        <Stat label="Mission T+" value={`${state.now.toFixed(1)} min`} className="hidden sm:flex" />
        <Stat
          label="Sector verified"
          value={`${cover.pct}%`}
          tone={cover.pct < 20 ? '#dc9a3f' : undefined}
        />
        <Stat label="Located" value={`${entries.length}`} className="hidden md:flex" />
        <Stat
          label="Units dark"
          value={`${dark} / ${state.robots.length}`}
          tone={dark > 0 ? '#dc9a3f' : undefined}
          className="hidden md:flex"
        />
        <Stat
          label="Orders unheard"
          value={`${queued}`}
          tone={queued > 0 ? '#dc9a3f' : undefined}
          className="hidden lg:flex"
        />
        <Stat label="Contested" value={`${open}`} tone={open > 0 ? '#e0565c' : undefined} />
      </div>

      <button
        onClick={onOpenProcess}
        className="ml-auto border border-[#3a342e] px-2.5 py-1.5 text-[12px] text-[#e8e1d8] transition-colors hover:border-[#6b6055] hover:bg-[#211c18]"
      >
        Design case study
      </button>
    </header>
  )
}
