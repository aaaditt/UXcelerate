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

## Responsive behaviour

Below the `lg` breakpoint the three columns collapse to a single scrolling column: map and timeline first, then triage, contested facts, log, fleet, legend. The map keeps its aspect ratio and stays legible; nothing is hidden, only re-stacked. This is a command-desk product, so desktop is the honest primary target — but a tablet at a forward staging point is plausible enough that it must not break.
