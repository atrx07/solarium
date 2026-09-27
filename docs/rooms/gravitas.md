# I · Gravitas

[← Room Atlas](./README.md)

**Medium:** N-body orbital mechanics  
**Introduced:** 001 / GENESIS  
**Source:** [`src/rooms/gravitas.ts`](../../src/rooms/gravitas.ts)

A tiny universe with no undo.

One heavy central body and several lighter bodies pull on each other continuously. The system is simple enough to understand and chaotic enough to become surprising.

## Interaction

- **Click** to add a new body with approximately tangential orbital velocity.
- **R** resets the system.
- **Space** pauses/resumes the simulation.

## Under the hood

Every body attracts every other body. Motion is integrated in seconds using the animation-frame delta.

A historical bug treated milliseconds as seconds and turned every orbit into a railgun. That incident is permanently documented because Solarium should remember when it accidentally violated spacetime.

## Intent

Gravitas is not a solar-system simulator. It is a small place to watch stable-looking arrangements negotiate with chaos.
