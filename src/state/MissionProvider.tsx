import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { NO_DECISIONS, coverage, stateAt, type Decisions } from '../sim/reducer'
import { T_MAX } from '../sim/script'
import { triage, type TriageEntry } from '../sim/scoring'
import type { MissionState } from '../sim/types'

interface MissionCtx {
  now: number
  setNow: (t: number) => void
  playing: boolean
  setPlaying: (p: boolean) => void
  state: MissionState
  entries: TriageEntry[]
  cover: ReturnType<typeof coverage>
  decisions: Decisions
  adjudicate: (factId: string, choice: 'a' | 'b' | 'verify') => void
  assign: (survivorId: string, robotId: string) => void
  selectedSurvivor: string | null
  setSelectedSurvivor: (id: string | null) => void
  selectedRobot: string | null
  setSelectedRobot: (id: string | null) => void
  /** Cells the operator has asked to see the provenance of. */
  inspect: { x: number; y: number } | null
  setInspect: (c: { x: number; y: number } | null) => void
}

const Ctx = createContext<MissionCtx | null>(null)

/** Real milliseconds per mission minute during playback. */
const MS_PER_MIN = 2200
const STEP = 0.05

export function MissionProvider({ children }: { children: ReactNode }) {
  const [now, setNowRaw] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [decisions, setDecisions] = useState<Decisions>(NO_DECISIONS)
  const [selectedSurvivor, setSelectedSurvivor] = useState<string | null>(null)
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null)
  const [inspect, setInspect] = useState<{ x: number; y: number } | null>(null)

  const setNow = useCallback((t: number) => {
    setNowRaw(Math.max(0, Math.min(T_MAX, t)))
  }, [])

  // Playback. Deliberately a fixed-step interval rather than rAF: the mission
  // clock should advance at the same rate on a 60 Hz and a 144 Hz display.
  const tick = useRef(0)
  tick.current = now
  useEffect(() => {
    if (!playing) return
    const h = window.setInterval(() => {
      const next = tick.current + STEP
      if (next >= T_MAX) {
        setNowRaw(T_MAX)
        setPlaying(false)
      } else {
        setNowRaw(next)
      }
    }, MS_PER_MIN * STEP)
    return () => window.clearInterval(h)
  }, [playing])

  const state = useMemo(() => stateAt(now, decisions), [now, decisions])
  const entries = useMemo(() => triage(state), [state])
  const cover = useMemo(() => coverage(state), [state])

  const adjudicate = useCallback(
    (factId: string, choice: 'a' | 'b' | 'verify') => {
      setDecisions((d) => ({
        ...d,
        adjudications: [
          ...d.adjudications.filter((a) => a.factId !== factId),
          { factId, choice, at: tick.current },
        ],
      }))
    },
    [],
  )

  const assign = useCallback((survivorId: string, robotId: string) => {
    setDecisions((d) => ({
      ...d,
      assignments: [
        ...d.assignments.filter((a) => a.survivorId !== survivorId),
        { survivorId, robotId, at: tick.current },
      ],
    }))
  }, [])

  const value: MissionCtx = {
    now,
    setNow,
    playing,
    setPlaying,
    state,
    entries,
    cover,
    decisions,
    adjudicate,
    assign,
    selectedSurvivor,
    setSelectedSurvivor,
    selectedRobot,
    setSelectedRobot,
    inspect,
    setInspect,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMission() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useMission must be used inside MissionProvider')
  return c
}
