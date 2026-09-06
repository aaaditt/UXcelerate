import { ageLabel, decayed, stalenessRatio } from '../../sim/decay'
import { useMission } from '../../state/MissionProvider'

/**
 * Legend + provenance inspector.
 *
 * The legend is not decoration. If confidence is encoded as material, the key
 * to that material has to be permanently on screen, not hidden behind a help
 * icon — otherwise the encoding is a private joke between the designer and the
 * data. The inspector answers the question every operator asks about any pixel
 * on a disaster map: who says so, and when did they say it?
 */

const SWATCHES = [
  { key: 'confirmed', label: 'Confirmed', hint: 'A unit physically traversed it', pattern: null, alpha: 1 },
  { key: 'reported', label: 'Reported', hint: 'Sensed at distance, unverified', pattern: 'url(#lStipple)', alpha: 0.74 },
  { key: 'inferred', label: 'Inferred', hint: 'Pre-quake municipal data', pattern: 'url(#lHatch)', alpha: 0.42 },
  { key: 'unknown', label: 'Unknown', hint: 'Never observed by anything', pattern: 'url(#lVoid)', alpha: 0.12 },
]

function Legend() {
  return (
    <div className="border-b border-[#2c2723] px-3 py-2.5">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80]">
        Confidence
      </p>
      <svg width="0" height="0" className="absolute">
        <defs>
          <pattern id="lHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#6b6055" strokeWidth="1.1" opacity="0.55" />
          </pattern>
          <pattern id="lStipple" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.75" fill="#8a7f72" opacity="0.5" />
          </pattern>
          <pattern id="lVoid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#4a423a" opacity="0.55" />
          </pattern>
        </defs>
      </svg>
      <ul className="space-y-1.5">
        {SWATCHES.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            <svg width="22" height="22" className="mt-px shrink-0 border border-[#3a342e]">
              <rect width="22" height="22" fill="#332c25" opacity={s.alpha} />
              {s.pattern && <rect width="22" height="22" fill={s.pattern} />}
            </svg>
            <span className="min-w-0">
              <span className="block text-[12px] text-[#e8e1d8]">{s.label}</span>
              <span className="block text-[11px] leading-snug text-[#9a8f80]">{s.hint}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-[#2c2723] pt-2 text-[11px] leading-relaxed text-[#9a8f80]">
        Confidence <span className="text-[#dc9a3f]">decays with age</span>. Ground nobody has
        re-checked slides back down this list on its own.
      </p>
    </div>
  )
}

function Inspector() {
  const { inspect, state } = useMission()

  if (!inspect) {
    return (
      <div className="px-3 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80]">
          Provenance
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#9a8f80]">
          Click any cell to see who reported it and how old that report is.
        </p>
      </div>
    )
  }

  const cell = state.grid[inspect.y]?.[inspect.x]
  if (!cell) return null
  const conf = decayed(cell.conf, cell.observedAt, state.now)
  const stale = stalenessRatio(cell, state.now)
  const contested = state.contests.find(
    (f) => !f.resolution && f.cells.some(([x, y]) => x === inspect.x && y === inspect.y),
  )

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8f80]">
          Provenance
        </p>
        <span className="tnum font-mono text-[10px] text-[#9a8f80]">
          {inspect.x}, {inspect.y}
        </span>
      </div>

      <dl className="mt-2 space-y-1.5 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[#9a8f80]">Belief</dt>
          <dd className="text-[#f2ede6]">{conf}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#9a8f80]">Passable</dt>
          <dd style={{ color: cell.passable ? '#62ab82' : '#e0565c' }}>
            {cell.passable ? 'yes' : 'no'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#9a8f80]">Source</dt>
          <dd className="font-mono text-[11px] text-[#f2ede6]">{cell.observedBy ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#9a8f80]">Observed</dt>
          <dd className="text-[#f2ede6]">{ageLabel(cell.observedAt, state.now)}</dd>
        </div>
      </dl>

      {cell.observedAt !== null && conf !== 'unknown' && conf !== 'inferred' && (
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-[#9a8f80]">Decays a step in</span>
            <span className="tnum font-mono text-[11px] text-[#dc9a3f]">
              {Math.max(0, Math.round((1 - stale) * (conf === 'confirmed' ? 14 : 9)))} min
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#2c2723]">
            <div className="h-full rounded-full bg-[#dc9a3f]" style={{ width: `${stale * 100}%` }} />
          </div>
        </div>
      )}

      {contested && (
        <p className="mt-2.5 border-l-2 border-[#dc9a3f] pl-2 text-[11px] leading-snug text-[#dc9a3f]">
          This cell is contested — {contested.subject}. Routes treat it as impassable until Command
          adjudicates.
        </p>
      )}
    </div>
  )
}

export function MapAside() {
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto border-t border-[#2c2723] bg-[#151210]">
      <Legend />
      <Inspector />
    </aside>
  )
}
