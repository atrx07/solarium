# The Atrium

[← Room Atlas](./README.md)

**Medium:** navigation / ambient space  
**Introduced:** 001 / GENESIS  
**Source:** [`src/rooms/atrium.ts`](../../src/rooms/atrium.ts)

The Atrium is Solarium's quiet center: one light, a slow orbit, and a growing set of anomalies.

It is intentionally not a dashboard. Rooms are discovered as objects in space rather than selected from a conventional menu.

## Interaction

- Move the pointer to create subtle parallax and a line back to the central light.
- Hover an anomaly to reveal its name.
- Click an anomaly to enter it.
- Number keys enter rooms directly.
- **Esc** returns here from any room.

The room count and numeric key hint are generated from the registered rooms, so the Atrium can grow without hand-editing its navigation copy.

## Intent

The Atrium should feel like arriving somewhere, not opening software.

Every new room changes its orbit, so the shape of the entrance quietly records Solarium's growth.
