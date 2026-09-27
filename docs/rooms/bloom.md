# II · Bloom

[← Room Atlas](./README.md)

**Medium:** reactive flow field / particles  
**Introduced:** 001 / GENESIS  
**Source:** [`src/rooms/bloom.ts`](../../src/rooms/bloom.ts)

Bloom is a field that remembers disturbance only long enough to become beautiful.

Hundreds of particles follow a changing flow rule while the canvas retains fading traces from previous frames.

## Interaction

- Move the pointer to bend the field.
- **Hold** to change the pointer's influence and push the field away.
- **Click** to release a burst.
- **R** reseeds the population.

## Under the hood

The particles are deliberately lightweight. Their accumulated trails matter as much as their instantaneous positions, so Bloom is drawn by slowly fading the previous frame rather than hard-clearing the canvas.

## Intent

Bloom is less about controlling particles and more about leaving temporary weather behind you.
