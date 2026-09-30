# XIII · Polarity

[← Room Atlas](./README.md)

**Medium:** electric field / signed charges  
**Introduced:** 011 / POLARITY  
**Source:** [`src/rooms/polarity.ts`](../../src/rooms/polarity.ts)

Positive and negative charges do not move. The space around them does all the interesting work.

## Interaction

- Move the pointer to probe the local field direction and relative strength.
- Click empty space to add a charge; signs alternate automatically.
- Click an existing charge to flip its sign.
- **C** clears every charge.
- **R** restores the canonical dipole.
- **Space** freezes/resumes the room's pulse animation.
- **Esc** returns to the Atrium.

## Under the hood

The field is evaluated from a softened inverse-square-style vector sum. Each charge contributes a signed vector based on direction and distance; the room samples that field on a bounded grid and draws small directional arrows.

A second, coarser scalar sample produces faint signed potential speckles so cancellation regions and dominant positive/negative regions remain visible even when the arrows are subtle.

The pointer acts only as a probe: it does not secretly alter the field. Charge count is capped at ten, and all rendering stays browser-local with no assets, APIs, or dependencies.

## Intent

Gravitas lets objects pull on objects.

Polarity is about something more abstract: how a few fixed signs can bend the meaning of empty space around them.
