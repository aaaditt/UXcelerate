# 02 · Personas

Two people share this screen. They want different things from it, and several design decisions exist only to keep both served without building two products.

---

## The Incident Commander

**Runs a sector. Radio in one hand. Not a roboticist.**

They answer one question, repeatedly, under time pressure:

> *Who do we reach next, and what does that cost?*

**Needs**
- Ranking they can *believe* — a number without its reasoning is a number they will override on instinct
- Provenance: who reported this, and how old is it
- To know what would change the ranking, so an argument about a street becomes a decision about a person

**Does not need**
- Battery curves, joint torque, per-unit telemetry
- To pilot anything

**Designed for them:** the triage queue with its score breakdown and counterfactual; the provenance inspector; the "sector verified %" in the command bar, which is deliberately a humbling number.

---

## The Robot Operator

**Owns the swarm's health and the mesh. Sits beside the Commander.**

> *Which units can still hear me, and how wrong is their position?*

**Needs**
- Link state with more resolution than a green dot
- Position uncertainty stated plainly, not implied
- To know which orders have not landed

**Does not need**
- Triage reasoning — they act on the Commander's decisions

**Designed for them:** four-valued link state (`live` / `degraded` / `dark` / `lost`); the uncertainty ellipse that grows with time since contact; the "orders this unit does not know about yet" count; the store-and-forward burst on reconnect.

---

## The tension, and how it is resolved

The Commander wants a **simplified, ranked** picture. The Operator wants an **honest, messy** one. Resolving that by building two screens would be the obvious move and the wrong one — they are looking at the same rubble and must not diverge.

Instead: **one map, layered honesty.** The map never hides mess — dark units stay, uncertainty grows, contested ground is marked — but the *ranking* does the simplifying, and every simplification is one click from its own justification. Nobody is shown a clean lie, and nobody is forced to read raw telemetry to make a call.
