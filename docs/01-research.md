# 01 · Research

## Where the domain knowledge comes from

This is a two-day competition entry, not a funded study. No rescuers were interviewed. What grounds it instead is the published record of robots actually used in collapses, and that record is unusually candid about interface failure:

- **Casper and Murphy's World Trade Center deployment study** — the founding text on human-robot interaction in rubble. Its central finding is not about robots at all: operators spent most of their attention *reconstructing situational awareness*, not driving. Teams repeatedly lost track of which voids had already been searched.
- **DARPA Subterranean Challenge** operator interfaces — where "the map is partial and the comms drop" was the explicit design constraint rather than an edge case. Store-and-forward via breadcrumb relays was standard, not exotic.
- **INSARAG** marking and triage conventions — the reason survivors here carry void-space and signal-corroboration attributes rather than a generic priority integer.

## What real deployments say goes wrong

Four failure modes recur, and each maps onto a mechanic in the product.

**1. Situational awareness is the bottleneck, not control.** The literature is consistent: operators are overloaded by *interpretation*, not by piloting. An interface optimised for driving robots is optimising the wrong task.

**2. Interfaces project confidence they do not have.** Displaying a pre-quake floorplan as if it were current is actively dangerous — floors pancake, stairwells become drops. A map that renders municipal CAD identically to a corridor a robot physically walked is lying by omission.

**3. Binary connectivity erases units.** When a robot drops off the network and disappears from the display, commanders re-task its sector. Two teams then search the same rubble while another void goes unvisited. The unit did not stop existing; only our knowledge of it did.

**4. Discovery arrives as interruption.** Alert-driven designs surface findings as transient notifications. In a queue-driven task, a notification that vanishes takes the only copy of the information with it.

## The reframe

Every clause of the brief is about *not knowing*. So:

> The commander's job is not to drive robots. It is to decide what to believe, and where to spend time they do not have.

That makes the primary object of the interface a **decision under uncertainty**, and it demotes the fleet to a supporting cast — the opposite of the conventional layout.

## Honest limits

The triage weighting is a designer's model of a rescuer's judgement, not a rescuer's. It is transparent and tunable precisely because it should not be trusted as-is; the next step is to sit with someone who has run INSARAG triage and correct it. See [`06-accessibility-audit.md`](06-accessibility-audit.md) for the same honesty applied to conformance.
