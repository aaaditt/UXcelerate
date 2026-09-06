import { useEffect, useState } from 'react'
import { ContestPanel } from './components/contest/ContestPanel'
import { FleetPanel } from './components/fleet/FleetPanel'
import { CityMap } from './components/map/CityMap'
import { MapAside } from './components/map/MapAside'
import { CommandBar } from './components/shell/CommandBar'
import { LogFeed } from './components/shell/LogFeed'
import { Timeline } from './components/time/Timeline'
import { TriagePanel } from './components/triage/TriagePanel'
import { Briefing } from './process/Briefing'
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
    <div className="flex h-full flex-col bg-[#0f0d0b]">
      <Shortcuts />
      <CommandBar onOpenProcess={() => setShowCase(true)} />

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
  const [entered, setEntered] = useState(false)

  // The deck mounts only after the briefing, so the incident starts playing
  // when somebody is actually watching it rather than in a background tab.
  if (!entered) return <Briefing onEnter={() => setEntered(true)} />

  return (
    <MissionProvider>
      <Deck />
    </MissionProvider>
  )
}
