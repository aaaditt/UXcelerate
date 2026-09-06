# 06 · Accessibility audit

Measured, not asserted — including what fails. An unverifiable conformance badge is worse than no badge, so there is no badge on this repo.

## Automated result

**Lighthouse (desktop, navigation mode, against the live production build):**

| Category | Score |
|---|---|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |

The first run scored **94**, failing two audits. Both were fixed rather than explained away:

1. `color-contrast` — the metadata tone `#857b6f` measured **4.49:1** on the panel surface `#151210`. That misses AA by 0.01. Replaced with `#9a8f80`, which measures **5.7–6.1:1** across all three surfaces.
2. `landmark-one-main` — the document had no `main` landmark. The command deck grid is now a `<main>`.

A 100 is a **floor, not a certificate**. Lighthouse cannot detect either of the real failures listed below, which is exactly why they are enumerated by hand.

## What conforms

**No information is carried by colour alone.** The one that matters most here, and it is structural rather than cosmetic:

| Information | Primary encoding | Redundant encoding |
|---|---|---|
| Map confidence | opacity | **texture** — solid / stipple / hatch / void |
| Triage priority | rank colour | **numeral** in the marker and the row |
| Link state | tag colour | **word** — Live / Degraded / Dark / Lost |
| Passability | colour in inspector | **word** — yes / no |
| Order status | colour | **word** — QUEUED / ACK |
| Unit class | — | **shape** — triangle / diamond / square / trapezoid |

Remove colour entirely and the interface still functions. That was the acceptance test.

**Contrast, measured against `#191614` (panel) — WCAG 2.1 relative luminance:**

| Token | Value | Ratio | AA normal (4.5) |
|---|---|---|---|
| `ink` | `#f2ede6` | 15.5:1 | pass |
| `ink-2` | `#b7ada0` | 8.1:1 | pass |
| `ink-3` | `#9a8f80` | 5.7:1 | pass |
| `urgent` | `#dc9a3f` | 7.5:1 | pass |
| `stable` | `#62ab82` | 6.6:1 | pass |
| `critical` | `#e0565c` | 4.9:1 | pass |

**Keyboard.** Every interactive control — beat buttons, timeline scrubber, triage rows, dispatch buttons, adjudication buttons, fleet rows, case study — is reachable by `Tab` with a visible 2px focus ring at 2px offset. Global shortcuts: `space` play/pause, `1`–`6` jump to beat, `esc` clear selection. Shortcut handling is suppressed while focus is in an input, so the timeline slider still takes arrow keys normally.

**Motion.** `prefers-reduced-motion: reduce` collapses all animation and transition to about 0ms.

**Structure.** `header` and `main` landmarks, `aria-expanded` on every disclosure row, `role="dialog"` with `aria-modal` and `Escape` on the case study, `aria-label` on the timeline range input.

**Non-text content.** The SVG map carries `role="img"` and an `aria-label` summarising live state — survivor count and open contested facts — so it is not an unlabelled graphic.

## What does not conform

Stated plainly rather than omitted. Neither of these is visible to an automated audit.

**1. The map is not keyboard navigable.** Cells respond to click but are not tabbable, so per-cell provenance is mouse-only. A screen-reader user gets the map summary and every panel, but not the inspector. **Fix:** roving `tabindex` over a `role="grid"` with arrow-key movement, announcing provenance into a live region. This is the first thing I would build with more time.

**2. Small mono labels on the map break the project's own floor.** Unit callsigns render at 8.5px. Contrast passes, but the size violates the 14px rule stated in the design system. They survive because they are redundant — the same information sits in the fleet list at full size — but they are a genuine failure, and the honest fix is to scale them with the viewport or show them only on hover and selection.

**3. No live region for incident events.** New survivors, link changes and contested facts appear silently to a screen reader; the user must re-read the log panel. **Fix:** an `aria-live="polite"` region mirroring comms-log arrivals.

**4. Colour-blind simulation is reasoned, not tested.** The redundant-encoding table means the interface should degrade safely under deuteranopia and protanopia, and greyscale was verified directly. Formal simulation across all three types was not run.

## Method

Contrast ratios computed from the token values against their actual rendered surfaces using the WCAG 2.1 relative-luminance formula. Lighthouse run in navigation mode against the deployed build, not a local dev server. Keyboard traverse walked manually through the whole deck. Greyscale checked by desaturating the rendered app. Responsive layout verified at 375px, 768px and 1440px.
