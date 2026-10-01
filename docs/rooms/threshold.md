# XV · Threshold

[← Room Atlas](./README.md)

**Medium:** site percolation / criticality  
**Introduced:** 013 / THRESHOLD  
**Source:** [`src/rooms/threshold.ts`](../../src/rooms/threshold.ts)

The chamber begins as a fixed hidden field of activation values.

Nothing moves when the visitor changes the threshold. Instead, more of that already-existing field becomes active. For a while the room contains only disconnected islands. Then a very small increase can suddenly create a continuous connected path from the top edge to the bottom.

## Interaction

- Move left/right to change the global activation threshold.
- Click to reseed the hidden field deterministically.
- **Space** locks/unlocks the current threshold.
- **R** restores the canonical field.
- **Esc** returns to the Atrium.

## Under the hood

Threshold uses a fixed 44 × 30 lattice. Each cell gets a deterministic pseudo-random value in `[0,1)`.

A cell is open when its hidden value is at or below the current threshold. Every frame, a bounded breadth-first search starts from open cells on the top edge and marks the connected component reachable through four-neighbor adjacency.

If that connected component reaches the bottom row, the room has a spanning path.

The visitor therefore does not redraw the board by moving. They reveal more of the same latent field until connectivity changes qualitatively.

## Intent

The room is about **criticality**: systems where gradual changes in one parameter can produce a sudden change in global behavior.

For most of the sweep, the difference between two nearby threshold values looks boringly small.

Then one cell matters.
