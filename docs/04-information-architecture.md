# 04 · Information architecture

## Layout

```
+------------------------------------------------------------------+
| COMMAND BAR - incident - clocks - verified % - dark - unheard     |
+------------+---------------------------------+-------------------+
| FLEET      |                                 | TRIAGE            |
|  link      |         BELIEF MAP              |  ranked people    |
|  orders    |         (the hero)              |  score breakdown  |
|            |                                 |  counterfactual   |
+------------+                                 +-------------------+
| LEGEND     |                                 | CONTESTED FACTS   |
| PROVENANCE +---------------------------------+-------------------+
|            | TIMELINE - scrub - six beats    | COMMS LOG         |
+------------+---------------------------------+-------------------+
```

## Why this arrangement

**The map is the hero and gets the whole centre column.** Every fact in the side rails is a fact *about somewhere*, so the map is the shared referent. An early version put the legend in a right-hand aside inside the map column; it cost about 220px of map width and was moved to the left rail.

**Left rail is capability. Right rail is decisions.** The left answers "what have I got, and what does the map mean." The right answers "what should I do." Reading left to right is the actual order of the Commander's reasoning.

**Triage sits above contested facts, which sits above the log.** Strict priority order: people, then the arguments blocking us from reaching people, then the narrative. The log is last because it is context, not action.

**The command bar carries humbling numbers.** *Sector verified 2%*, *units dark 2/6*, *orders unheard 3*. Most dashboards put reassuring metrics in this position. Putting the gaps there instead is the whole thesis in six statistics.

## The legend is not optional chrome

If confidence is encoded as material, the key to that material must be **permanently on screen**. Hidden behind a help icon, the encoding becomes a private joke between the designer and the data. It costs left-rail space and earns it back immediately.

## What is deliberately absent

- **No per-robot FPV video.** It invites 1:1 teleoperation, which is the cognitive trap the domain literature warns about.
- **No battery or telemetry dashboard.** Battery appears as one number in the fleet list. It is not a decision input at this altitude.
- **No notification toasts.** See [`03-user-flows.md`](03-user-flows.md), Flow A.
- **No settings, no login, no theme toggle.** Nothing that is not the incident.

## The rejected option: a real basemap

The obvious move is to drop markers onto OpenStreetMap, or to build a 3D city. Both were considered and rejected, and the reason is the entire thesis.

**A photographic basemap asserts that the city is known.** Every road drawn crisply underneath the robots is a claim that somebody has verified it — which is exactly what the brief says is not true. Render a pristine street network and you have designed away the problem you were asked to solve; the uncertainty can then only be a decoration layered on top of an authoritative picture.

Hand-drawing the district in SVG buys three things instead:

1. **Uncertainty becomes drawable.** Confidence *is* the map — its texture, its opacity, its fade over time. That is not available when compositing over somebody else's tiles.
2. **It cannot fail.** No WebGL context, no tile server, no network dependency in the render path.
3. **It is honest about scale.** Six units covering a few percent of a sector. A detailed 3D city makes that look like coverage. A field of black does not.

## The entry screen

The deck opens behind a briefing rather than dropping a visitor straight into it. A command interface seen cold is unreadable — panels and a dark map, with no way to know what the idea was. The briefing states the reframe, then uses the *How old it is* view as its hero, because the strongest argument the product can make is the sight of how little has actually been seen.

It is one screen and one button, not a guided tour. A tour would be an admission that the interface cannot explain itself.

## Responsive behaviour

Below the `lg` breakpoint the three columns collapse to a single scrolling column: map and timeline first, then triage, contested facts, log, fleet, legend. The map keeps its aspect ratio and stays legible; nothing is hidden, only re-stacked. This is a command-desk product, so desktop is the honest primary target — but a tablet at a forward staging point is plausible enough that it must not break.
