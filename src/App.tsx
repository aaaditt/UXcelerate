import { useEffect, useState } from 'react'
import { ContestPanel } from './components/contest/ContestPanel'
import { FleetPanel } from './components/fleet/FleetPanel'
import { CityMap } from './components/map/CityMap'
import { MapAside } from './components/map/MapAside'
import { CommandBar } from './components/shell/CommandBar'
import { LogFeed } from './components/shell/LogFeed'
import { Timeline } from './components/time/Timeline'
import { TriagePanel } from './components/triage/TriagePanel'
import { CaseStudy } from './process/CaseStudy'
import { BEATS } from './sim/script'
import { MissionProvider, useMission } from './state/MissionProvider'

function Shortcuts() {
  const { setPlaying, playing, setNow, setSelectedRobot, setSelectedSurvivor, setInspect } =
    useMission()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        setPlaying(!playing)
      }
      if (e.key === 'Escape') {
        setSelectedRobot(null)
        setSelectedSurvivor(null)
        setInspect(null)
      }
      const n = Number(e.key)
      if (n >= 1 && n <= BEATS.length) {
        setPlaying(false)
        setNow(BEATS[n - 1].t)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, setPlaying, setNow, setSelectedRobot, setSelectedSurvivor, setInspect])

  return null
}

const ORIENTED = 'cairn.oriented'

/**
 * One line, once. Not a tour, not a modal, not a five-step overlay — those all
 * assume the interface cannot explain itself. This says the single thing that
 * is not guessable from looking, then gets out of the way for good.
 */
function Orientation() {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(ORIENTED) === '1'
    } catch {
      return false
    }
  })
  if (seen) return null

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#dc9a3f]/35 bg-[#dc9a3f]/8 px-4 py-2.5">
      <p className="flex-1 text-[12.5px] leading-relaxed text-[#e8e1d6]">
        Nothing on this map is a fact — it is a belief with an age. Hatched ground is pre-quake
        city data that nobody has been to. The incident is playing itself; press{' '}
        <kbd className="border border-[#554d43] px-1 font-mono text-[11px]">space</kbd> to pause.
      </p>
      <button
        onClick={() => {
          try {
            localStorage.setItem(ORIENTED, '1')
          } catch {
            /* private window, and it does not matter */
          }
          setSeen(true)
        }}
        className="shrink-0 border border-[#554d43] px-2.5 py-1 text-[12px] text-[#e8e1d6] hover:bg-[#201c17]"
      >
        Got it
      </button>
    </div>
  )
}

function Deck() {
  const [showCase, setShowCase] = useState(false)

  return (
    <div className="flex h-full flex-col bg-[#0f0d0b]">
      <Shortcuts />
      <CommandBar onOpenProcess={() => setShowCase(true)} />
      <Orientation />

      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[252px_minmax(0,1fr)_340px]">
        {/* left rail: what we have, and what the map is saying */}
        <div className="hidden min-h-0 flex-col overflow-y-auto lg:flex">
          <FleetPanel />
          <MapAside />
        </div>

        {/* the map is the hero and gets the whole centre column. On narrow
            screens a flex child collapses to zero height, so it takes an
            explicit viewport-relative height there instead. */}
        <div className="flex flex-col border-[#2b2620] lg:min-h-0 lg:border-x">
          <div className="h-[58svh] min-w-0 lg:h-auto lg:min-h-0 lg:flex-1">
            <CityMap />
          </div>
          <Timeline />
        </div>

        {/* right rail: the decisions */}
        <div className="flex flex-col lg:min-h-0 lg:overflow-y-auto">
          <TriagePanel />
          <ContestPanel />
          <LogFeed />
        </div>
      </div>

      {/* narrow viewports get the rest stacked below */}
      <div className="grid grid-cols-1 lg:hidden">
        <FleetPanel />
        <MapAside />
      </div>

      {showCase && <CaseStudy onClose={() => setShowCase(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <MissionProvider>
      <Deck />
    </MissionProvider>
  )
}
