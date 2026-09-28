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
- **Tab** to focus the stage, move the virtual cursor with **Arrow** keys (**Shift + Arrow** for larger steps), and press **Enter** or **Space** to enter the nearby anomaly.
- **1–9** jump directly to the first nine rooms, where available. A future tenth room will not require a fictional multi-digit keypress: every room is accessible through its orbiting light.
- **Esc** returns here from any room.

The room count is generated from registered rooms; the number-key hint stops at nine. If hit areas overlap as the orbit grows, the closest anomaly to the pointer or virtual cursor wins, so activation and hover agree.

## Intent

The Atrium should feel like arriving somewhere, not opening software.

Every new room changes its orbit, so the shape of the entrance quietly records Solarium's growth.
