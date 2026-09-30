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
- **Space** switches between **FIELD** and **POTENTIAL** lenses.
- **Esc** returns to the Atrium.

## Under the hood

The field is evaluated from a softened inverse-square-style vector sum. Each charge contributes a signed vector based on direction and distance; the room samples that field on a bounded grid and draws small directional arrows.

A second signed scalar sample renders electric-potential structure. In **FIELD** view it stays faint behind the arrows; in **POTENTIAL** view the vector grid steps back and the signed scalar texture becomes denser and stronger, revealing cancellation zones and regions dominated by positive or negative influence.

The pointer acts only as a probe: it does not secretly alter the field. Charge count is capped at ten, and all rendering stays browser-local with no assets, APIs, or dependencies.

## Intent

Gravitas lets objects pull on objects.

Polarity is about something more abstract: how a few fixed signs can bend the meaning of empty space around them.
