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

function Deck() {
  const [showCase, setShowCase] = useState(false)

  return (
    <div className="flex h-full flex-col bg-[#0d0b0a]">
      <Shortcuts />
      <CommandBar onOpenProcess={() => setShowCase(true)} />

      <main className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[248px_minmax(0,1fr)_336px]">
        {/* left rail: who we have, and the key to what the map is saying */}
        <div className="hidden min-h-0 grid-rows-[minmax(0,auto)_minmax(0,1fr)] lg:grid">
          <FleetPanel />
          <MapAside />
        </div>

        {/* the map is the hero: it gets the whole centre column.
            On narrow screens a flex child would collapse to zero height, so the
            map is given an explicit viewport-relative height there instead. */}
        <div className="flex flex-col border-[#2c2723] lg:min-h-0 lg:border-x">
          <div className="h-[58svh] min-w-0 lg:h-auto lg:min-h-0 lg:flex-1">
            <CityMap />
          </div>
          <Timeline />
        </div>

        {/* right rail */}
        <div className="grid grid-rows-none lg:min-h-0 lg:grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
          <TriagePanel />
          <ContestPanel />
          <LogFeed />
        </div>
      </main>

      {/* narrow viewports get the panels stacked below the map */}
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
