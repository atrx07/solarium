# III · Resonance

[← Room Atlas](./README.md)

**Medium:** Web Audio / spatial instrument  
**Introduced:** 001 / GENESIS  
**Source:** [`src/rooms/resonance.ts`](../../src/rooms/resonance.ts)

Resonance turns position into short-lived sound.

It became the first room someone accidentally spent several minutes simply *playing*, which helped define an important Solarium rule: sound is allowed to be a first-class material, not decoration.

## Interaction

- **Click** to wake audio and play a note.
- Horizontal position chooses pitch.
- Vertical position changes decay.

The browser requires a user gesture before audio begins, so the room stays silent until the first click.

## Under the hood

Sound is synthesized locally with the Web Audio API. Nothing is uploaded, recorded, streamed, or fetched from a service.

## Intent

Resonance is a tiny instrument, not a sequencer. The goal is immediate play: click somewhere, hear the room answer.
