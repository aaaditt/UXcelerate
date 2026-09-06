# 03 · User flows

Three flows carry the product. Everything else is support.

---

## Flow A — Triage a new discovery

```
robot detects signal
  -> enters queue as CANDIDATE (never a toast)
  -> commander opens it
      -> reads score breakdown: vitals - void - corroboration - time - route trust
      -> reads counterfactual, if any
  -> dispatches a unit
      -> unit LIVE   : order acknowledged
      -> unit DARK   : order QUEUED, stated plainly, delivered on next contact
```

**The design decision:** a discovery is never presented as an interruption to dismiss. It is presented as an item to rank. The cost is that nothing flashes for attention; the benefit is that nothing is ever lost by being ignored for ninety seconds.

---

## Flow B — Adjudicate a contested fact

```
two units report incompatible observations about the same ground
  -> system does NOT silently prefer the newer or higher-ranked sensor
  -> contested fact raised, both claims attributed (unit - sensor - timestamp)
  -> consequence preview: which survivors move rank if this resolves either way
  -> commander chooses
      -> trust A         : cells become confirmed-passable per A
      -> trust B         : cells become confirmed-impassable per B
      -> send to verify  : stays impassable until physically confirmed
  -> decision logged with who, what, when
```

**The design decision:** while unresolved, contested ground is treated as **impassable in every route calculation**. Optimism is not the safe default when the downside is routing a team into a collapse.

---

## Flow C — Lose and regain a unit

```
link degrades -> DARK
  -> unit stays on the map at last-known position
  -> uncertainty ellipse begins growing with time since contact
  -> new orders QUEUE rather than fail
  -> fleet list counts "orders this unit does not know about yet"

reconnect
  -> store-and-forward burst
  -> observations arrive stamped with their ORIGINAL time
  -> comms log shows both clocks: received T+11, occurred T+9.2
  -> queued orders flush and acknowledge
  -> backfill may overturn something believed in the interim
```

**The design decision:** a unit you cannot hear has not stopped existing. Deleting it is the single most consequential lie a fleet UI can tell, because it causes duplicate searches.

---

## The flows are not independent

The point of the demo is that they **collide**: the T+11 backfill (Flow C) resolves the T+04 contest (Flow B), which reorders the triage queue (Flow A). That chain is the argument for the whole design.
