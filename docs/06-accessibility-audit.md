# 06 · Accessibility audit

Measured and stated honestly, including what fails. An unverifiable conformance badge is worse than no badge — so there is no badge on this repo.

## What conforms

**No information is carried by colour alone.** This is the one that matters most here, and it is structural rather than cosmetic:

| Information | Primary encoding | Redundant encoding |
|---|---|---|
| Map confidence | opacity | **texture** — solid / stipple / hatch / void |
| Triage priority | rank colour | **numeral** in the marker and the row |
| Link state | tag colour | **word** — Live / Degraded / Dark / Lost |
| Passability | colour in inspector | **word** — yes / no |
| Order status | colour | **word** — QUEUED / ACK |
| Unit class | — | **shape** — triangle / diamond / square / trapezoid |

Remove colour entirely and the interface still functions. That was the acceptance test.

**Contrast.** Body text `#f2ede6` on `#191614` is about **15.6:1**. Secondary `#b7ada0` on `#191614` is about **8.4:1**. Metadata `#857b6f` on `#191614` is about **4.6:1** — above AA for normal text. Semantic amber `#dc9a3f` is about **7.4:1**; critical `#e0565c` is about **5.3:1**.

**Keyboard.** Every interactive control — beat buttons, timeline scrubber, triage rows, dispatch buttons, adjudication buttons, fleet rows, case study — is reachable by `Tab` with a visible 2px focus ring at 2px offset. Global shortcuts: `space` play/pause, `1`–`6` jump to beat, `esc` clear selection. Shortcut handling is suppressed while focus is in an input, so the timeline slider still takes arrow keys normally.

**Motion.** `prefers-reduced-motion: reduce` collapses all animation and transition to about 0ms.

**Structure.** Landmark regions, `aria-expanded` on every disclosure row, `role="dialog"` with `aria-modal` and `Escape` on the case study, and `aria-label` on the timeline range input.

**Non-text content.** The SVG map carries `role="img"` and an `aria-label` summarising live state — survivor count and open contested facts — so it is not an unlabelled graphic.

## What does not conform

Stated plainly rather than omitted.

**1. The map is not keyboard navigable.** Cells respond to click but are not tabbable, so per-cell provenance is mouse-only. A screen-reader user gets the map summary and every panel, but not the inspector. **Fix:** roving `tabindex` over a `role="grid"` with arrow-key movement, announcing provenance into a live region. This is the first thing I would build with more time.

**2. Small mono labels on the map fall below the project's own floor.** Unit callsigns render at 8.5px in `#b7ada0`. Contrast is fine but the size violates the 14px rule stated in the design system. They survive because they are redundant — the same information is in the fleet list at full size — but they are a genuine failure. **Fix:** scale map labels with viewport, or show them on hover and selection only.

**3. No live region for incident events.** New survivors, link changes and contested facts appear silently to a screen reader; the user must re-read the log panel. **Fix:** an `aria-live="polite"` region mirroring comms-log arrivals.

**4. Colour-blind simulation is reasoned, not tested.** The redundant-encoding table above means the interface should degrade safely under deuteranopia and protanopia, and greyscale was checked directly. Formal simulation across all three types was not run.

## Method

Contrast ratios computed from the token values against their actual surfaces. Keyboard traverse walked manually through the whole deck. Greyscale check done by desaturating the rendered app. An automated Lighthouse accessibility audit was run against the production build — its score is a floor, not a certificate, and it cannot detect failures 1 or 3 above, which is exactly why they are listed here by hand.
