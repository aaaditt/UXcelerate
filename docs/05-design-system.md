# 05 · Design system

## The one rule

> **Colour is a scarce resource. In this interface it only ever means risk or confidence.**

There is no brand accent. There is no decorative cyan. Interactive affordance is carried by border, weight and a bright neutral — never by hue. The result is that when something on this screen turns amber or red, it *means* something, and the eye goes there.

This is also the sharpest departure from convention in this problem space, where the norm is neon-on-navy. Real safety-critical equipment — ICU monitors, air traffic displays, INSARAG field kit — is not neon.

## Surfaces — warm graphite, not blue-black

| Token | Value | Use |
|---|---|---|
| `s0` | `#100e0c` | app ground |
| `s1` | `#191614` | panels |
| `s2` | `#221e1a` | raised |
| `line` | `#3a342e` | borders |
| `ink` | `#f2ede6` | primary text |
| `ink-2` | `#b7ada0` | secondary text |
| `ink-3` | `#9a8f80` | labels, metadata (5.7:1 on panel) |

Warm rather than cool is a deliberate register shift away from the sci-fi HUD. It should read as an instrument someone is accountable for.

## Semantic colour — the only colour

| Token | Value | Means |
|---|---|---|
| `critical` | `#e0565c` | impassable ground, rank-1 casualty |
| `urgent` | `#dc9a3f` | contested, hazard, stale, unheard order |
| `stable` | `#62ab82` | acknowledged, resolved, live link |
| `aerial` | `#7d9fc4` | air-sourced observation |

## Confidence encoding — material, not hue

The load-bearing decision. Each state has a **distinct texture**, so it survives greyscale, colour blindness, and a projector with bad gamma:

| State | Encoding | Meaning |
|---|---|---|
| **Confirmed** | solid fill, full opacity | a unit physically traversed it |
| **Reported** | stipple (fine dots), 82% | sensed at distance, unverified |
| **Inferred** | 45° hatch, 50% | pre-quake municipal data |
| **Unknown** | sparse void dots, 20% | never observed by anything |

Opacity descends with certainty so that **certainty reads as presence** — the unexplored parts of the district recede rather than sitting there looking like clear ground.

Redundant encodings elsewhere: triage order is a **numeral**; link state is a **word**; passability is a **word** in the inspector; unit class is a **shape** (triangle, diamond, square, trapezoid).

## Type

- **14px floor for body text.** Dense tactical UIs habitually drop to 10px and lose all hierarchy under load — exactly when load matters most.
- **Tabular figures** (`font-variant-numeric: tabular-nums`) on every ticking number, so columns do not jitter.
- **Monospace only for genuine machine data** — unit callsigns, timestamps, coordinates, sensor strings. Prose is sans.
- Uppercase with `0.14em` tracking for panel labels only, at 10–11px, where it functions as a structural marker rather than text to read.

## Motion

Functional only: meter widths and the confidence-decay bar transition. Nothing pulses, sweeps, or scans. All transitions collapse to about 0ms under `prefers-reduced-motion`.

## Why plain SVG

No map vendor, no WebGL. Two reasons, in order of importance:

1. **Robustness.** A heavy basemap that fails renders a black screen, and a black screen is a lost competition entry.
2. **Control.** The confidence encoding *is* the map. Fighting a vendor basemap for the right to draw hatched fog would have been the whole build.
