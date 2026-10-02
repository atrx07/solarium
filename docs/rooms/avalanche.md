# XIX · Avalanche

[← Room Atlas](./README.md)

**Medium:** Abelian sandpile / self-organized criticality  
**Introduced:** 017 / AVALANCHE  
**Source:** [`src/rooms/avalanche.ts`](../../src/rooms/avalanche.ts)

Avalanche is built from one local rule:

> A cell may hold zero to three grains. At four, it topples.

A toppling removes four grains from that cell and gives one grain to each cardinal neighbor. Grains that cross the outer boundary leave the chamber.

That is the entire mechanism.

## Interaction

- Click inside the chamber to add exactly one grain.
- Hold to rain grains slowly at the pointer.
- **Space** pauses/resumes redistribution.
- **R** restores the canonical near-critical pile.
- **Esc** returns to the Atrium.

## Under the hood

The chamber uses a fixed 54 × 36 integer lattice.

The canonical field begins in a deterministic stable state biased toward heights two and three. It is intentionally already close to critical so the visitor can reach interesting cascades without spending several minutes manually loading the system.

When a cell reaches four grains, it enters a bounded processing queue. One toppling subtracts four from that cell and adds one to each orthogonal neighbor. Newly unstable neighbors enter the same queue. Open boundaries dissipate grains that leave the lattice.

The simulation processes only a bounded number of topplings per rendered frame. Large cascades therefore remain visible instead of being solved invisibly in one synchronous burst.

The warm flashes are witnesses only. They do not influence the rule.

## Intent

Threshold explored a critical transition controlled by one global parameter.

Avalanche explores a different kind of criticality: repeated local additions keep pushing a dissipative system toward states where a tiny event can have a wildly disproportionate consequence.

There is no avalanche object in the room.

There are only grains, thresholds, neighbors, and an edge where excess can escape.
