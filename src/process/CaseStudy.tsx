import { useEffect, useRef } from 'react'

/**
 * The written case. It lives inside the product rather than only in the repo,
 * because a judge who is already in the app should not have to leave it to
 * find out why anything on screen looks the way it does.
 */

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-11 border-b border-[#2b2620] pb-2 text-[16px] font-semibold text-[#f4efe7] first:mt-0">
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3.5 text-[14px] leading-[1.75] text-[#b9af9f]">{children}</p>
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 border-l-2 border-[#dc9a3f] py-1 pl-3.5 text-[14px] leading-[1.75] text-[#e8e1d6]">
      {children}
    </p>
  )
}

function Pair({ problem, answer }: { problem: string; answer: React.ReactNode }) {
  return (
    <div className="mt-4 grid gap-1.5 border border-[#2b2620] p-3.5 sm:grid-cols-[178px_1fr] sm:gap-5">
      <p className="text-[13px] font-medium leading-relaxed text-[#dc9a3f]">{problem}</p>
      <p className="text-[13.5px] leading-[1.7] text-[#b9af9f]">{answer}</p>
    </div>
  )
}

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-medium text-[#f4efe7]">{children}</strong>
)

export function CaseStudy({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 sm:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Design case"
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="mx-auto max-w-2xl border border-[#3a342c] bg-[#17140f] p-6 sm:p-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[23px] font-semibold leading-tight text-[#f4efe7]">
              Designing for a map you cannot trust
            </h2>
            <p className="mt-1.5 text-[13px] text-[#9a8f80]">
              The thinking behind CAIRN, and what I took back out.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 border border-[#3a342c] px-3 py-1.5 text-[12.5px] text-[#e8e1d6] hover:border-[#554d43] hover:bg-[#201c17]"
          >
            Close
          </button>
        </div>

        <H>The brief, and the reframe</H>
        <P>
          The brief asks for an interface to coordinate rescue robots after an earthquake, where
          maps may be incomplete, communication may be unreliable, and robots continuously discover
          survivors, blocked paths, hazards and new routes.
        </P>
        <P>
          Read literally, that is a request for a fleet dashboard. But every clause in it is about{' '}
          <em>not knowing things</em>. So the design question is not how to display six robots:
        </P>
        <Callout>
          The commander&rsquo;s job is not to drive robots. It is to decide what to believe, and
          where to spend time they do not have. So the primary object of this interface is a
          decision under uncertainty, not a fleet.
        </Callout>
        <P>
          That single move is what separates CAIRN from a dashboard. A cairn is what people build to
          mark a safe route when there is no map — which is exactly the job.
        </P>

        <H>Who is at the desk</H>
        <P>
          <B>The incident commander</B> is not a roboticist. They are running a sector under
          INSARAG-style triage with a radio in one hand, and they answer one question repeatedly:
          who do we reach next, and what does that cost? They need ranking and provenance. They do
          not need telemetry.
        </P>
        <P>
          <B>The robot operator</B> owns the swarm and the mesh. They need to know which units are
          unreachable, how stale each position is, and which orders have not landed. They are the
          reason link state has four values instead of a green dot.
        </P>
        <P>
          The commander wants a simplified picture; the operator wants an honest, messy one.
          Building two screens would have been the obvious move and the wrong one — they are looking
          at the same rubble and must not diverge. Instead the map never hides mess, the ranking
          does the simplifying, and every simplification is one click from its own justification.
        </P>

        <H>Four hard problems, four mechanics</H>
        <Pair
          problem="Maps may be incomplete"
          answer={
            <>
              Certainty is drawn as <B>material</B> — solid, stipple, hatch, void — not as colour,
              so it survives greyscale and colour blindness. And it <B>decays with age</B>,
              continuously rather than in steps: ground nobody re-checks fades on screen while you
              watch. Switch the map to <B>How old it is</B> and the argument becomes undeniable —
              everything six units have ever seen is a small archipelago in a black district.
            </>
          }
        />
        <Pair
          problem="Robots discover contradictions"
          answer={
            <>
              When an aerial unit says a street is clear and a ground unit says it is blocked, the
              system <B>refuses to silently pick a winner</B>. It raises the dispute, attributes
              both claims with sensor and timestamp, and shows what each choice does to the triage
              order. Software that projects confidence it does not have is how people get hurt.
            </>
          }
        />
        <Pair
          problem="Communication may be unreliable"
          answer={
            <>
              A unit that cannot hear us is <B>never removed from the map</B>. It holds its
              last-known position inside a circle that grows as contact ages. Orders queue rather
              than fail, and the fleet list counts the orders a unit does not know about yet.
              Deleting a unit you cannot hear is how two teams end up searching the same rubble.
            </>
          }
        />
        <Pair
          problem="Continuous discovery"
          answer={
            <>
              Discoveries enter as <B>candidates to be triaged in</B>, never as toasts that vanish
              carrying the only copy of the information. The queue ranks people, shows its
              arithmetic, and states the counterfactual — rank three becomes rank one if Almeida St
              turns out to be passable — which is what turns an argument about a street into a
              decision about a person.
            </>
          }
        />

        <H>The idea that makes it work</H>
        <P>
          Every event carries two clocks: <B>t</B>, when it happened, and <B>known</B>, when Command
          learned it. State is a fold that filters on <B>known</B> but applies events in <B>t</B>{' '}
          order.
        </P>
        <P>
          For a live unit the two are identical. For MOLE-6, which goes dark at eight minutes and
          returns at eleven, they diverge — and its three minutes of observations arrive{' '}
          <B>already stale</B>, slotting into the timeline where they really belong. The map gains
          information about its own past, and that backfill is what finally settles the dispute
          raised seven minutes earlier.
        </P>
        <Callout>
          This is the rare case where the engineering choice and the design choice are the same
          choice. Store-and-forward, the timeline scrubber, confidence decay, and &ldquo;what did we
          know four minutes in&rdquo; are all the same query with a different bound.
        </Callout>

        <H>Colour is a scarce resource</H>
        <P>
          Real safety-critical equipment — ICU monitors, air traffic displays, INSARAG field kit —
          is not neon. Here colour only ever means risk or confidence. There is no brand accent, and
          interactive state is carried by weight, border and a bright neutral instead of hue. When
          something on this screen turns amber, it means something.
        </P>
        <P>
          Body text never drops below 14px, because dense tactical interfaces habitually fall to
          10px and lose all hierarchy exactly when load matters most. Numbers use tabular figures so
          columns do not jitter as they tick. The typeface is IBM Plex, drawn for technical
          instruments; monospace appears only where the content is genuinely machine output —
          callsigns, clocks, coordinates.
        </P>

        <H>What I took back out</H>
        <P>
          An earlier version of this deck had a tracked-out capitalised label above every panel and
          every section, meta strings strung together with middle dots, and monospace on all of it.
          It looked technical. It was decoration pretending to be structure: six panels shouting
          equally, so nothing could be more important than anything else.
        </P>
        <P>
          Stripping it back to sentence case, and letting weight, size and space carry the
          hierarchy, made the screen quieter and easier to scan. The command bar was rebuilt around
          the same idea — it now carries the <B>gaps</B> rather than reassuring totals, and each
          figure escalates from dormant grey to amber as it goes wrong, so you can read how bad it
          is without reading a single label.
        </P>

        <H>Accessibility, stated honestly</H>
        <P>
          Lighthouse rates the live build 100 for accessibility, best practices and SEO. That is a
          floor, not a certificate, and it cannot see the two things that actually fail: the map is
          not keyboard navigable, so per-cell provenance is mouse-only, and there is no live region
          announcing incident events to a screen reader. Both are written up in the repo rather than
          hidden behind a badge.
        </P>
        <P>
          What does hold: no information is carried by colour alone — certainty is texture, triage
          order is a numeral, link state is a sentence. Every control is keyboard reachable with a
          visible focus ring, and reduced-motion is respected.
        </P>

        <H>What I would do next</H>
        <P>
          Make the map a proper roving-tabindex grid so provenance is reachable without a mouse.
          Introduce a second dispute of a different shape — a disagreement about a person rather
          than a street — to test whether the adjudication pattern generalises. And run the triage
          weighting past somebody who has actually done INSARAG triage, because right now it is a
          designer&rsquo;s model of a rescuer&rsquo;s judgement, not a rescuer&rsquo;s.
        </P>

        <p className="mt-11 border-t border-[#2b2620] pt-4 text-[12.5px] leading-relaxed text-[#9a8f80]">
          Keyboard: <span className="text-[#b9af9f]">space</span> plays and pauses,{' '}
          <span className="text-[#b9af9f]">1</span> to <span className="text-[#b9af9f]">6</span>{' '}
          jump between moments, <span className="text-[#b9af9f]">esc</span> clears the selection.
        </p>
      </div>
    </div>
  )
}
