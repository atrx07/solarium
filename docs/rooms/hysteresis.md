# XVI · Hysteresis

[← Room Atlas](./README.md)

**Medium:** bistable domains / path-dependent memory  
**Introduced:** 014 / HYSTERESIS  
**Source:** [`src/rooms/hysteresis.ts`](../../src/rooms/hysteresis.ts)

Hysteresis asks a deliberately strange question:

> Can the room remember where you came from even when the current input is the same?

Its answer is yes.

## Interaction

- Move left/right to change the external field.
- Click to generate another deterministic material with different switching thresholds.
- **Space** removes the external field without resetting the domains.
- Move the pointer again to resume direct control.
- **R** restores the canonical material.
- **Esc** returns to the Atrium.

## Under the hood

The chamber contains a bounded grid of independent bistable domains.

Each domain stores:

- an upper threshold that flips it into the positive state,
- a lower threshold that flips it into the negative state,
- its current state.

Between those two thresholds, the domain does nothing. It keeps whichever state it already had.

That small gap is the memory.

As the external field sweeps right, domains flip positive at different values. Sweeping back left does not immediately undo those flips; each domain waits until its own lower threshold is crossed.

The bottom trace plots applied field **H** against collective magnetization **M**. Returning to the same H through a different path can therefore land at a different M.

Pressing **Space** sets H to zero and holds it there until the pointer actually moves again. If the collective state remains biased at zero field, the room is showing remanence rather than a one-frame visual trick.

## Intent

Threshold was about one parameter changing global connectivity.

Hysteresis is about something more intimate:

**the present is not always enough to determine the state. Sometimes the path matters.**
