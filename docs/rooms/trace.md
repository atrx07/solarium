# XVIII · Trace

[← Room Atlas](./README.md)

**Medium:** stigmergy / indirect collective communication  
**Introduced:** 016 / TRACE  
**Source:** [`src/rooms/trace.ts`](../../src/rooms/trace.ts)

Trace is a colony whose agents do not message one another directly.

They modify the floor.

That is enough.

## Interaction

- Click empty space to plant a resource source.
- Click an existing source to remove it.
- Up to five sources can exist; adding another replaces the oldest.
- **C** clears both trail fields without resetting the agents or sources.
- **Space** pauses/resumes the colony.
- **R** restores the canonical colony and source layout.
- **Esc** returns to the Atrium.

## Under the hood

The room keeps two bounded scalar fields on a fixed 84 × 52 lattice:

- a cool **home** trail,
- a warm **food** trail.

Searching agents leave home trail behind them and sample the food trail ahead.

Returning agents leave food trail behind them and sample the home trail ahead.

Agents only sense a few short-range samples in front-left, front, and front-right. If no useful trail exists, deterministic wandering takes over.

The fields diffuse slightly and decay continuously.

No agent knows the global source map, no agent stores a route, and no central pathfinder exists.

When a stable trail network appears, it is produced by repeated local edits to a shared environment.

That form of indirect coordination is called **stigmergy**.

## Intent

Murmuration communicates through immediate neighbors.

Trace communicates through the world itself.

**No one draws the road. The road is the memory of everyone who passed through.**
