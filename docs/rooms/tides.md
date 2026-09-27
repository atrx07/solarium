# VI · Tides

[← Room Atlas](./README.md)

**Medium:** discrete wave field  
**Introduced:** 004 / TIDES  
**Source:** [`src/rooms/tides.ts`](../../src/rooms/tides.ts) · [room wrapper](../../src/rooms/tides-room.ts)

Tides is a continuous medium rather than a collection of visible agents.

Disturbances propagate through a bounded numerical field, overlap, cancel, amplify, and reflect.

## Interaction

- **Click** to drop a strong disturbance.
- **Hold and drag** to make a trail of lighter disturbances — effectively rain.
- **R** resets the field.

## Under the hood

The simulation uses current and previous field states with a fixed integration step. It renders through a lower-resolution offscreen canvas that is scaled to the viewport.

It is a wave system, not particles pretending to be water.

## Intent

A few gestures should be enough to create interference patterns worth watching after you stop touching the room.
