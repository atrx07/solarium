# The Atrium

[← Room Atlas](./README.md)

**Medium:** navigation / ambient space  
**Introduced:** 001 / GENESIS  
**Source:** [`src/rooms/atrium.ts`](../../src/rooms/atrium.ts)

The Atrium is Solarium's quiet center: one light, a growing set of anomalies, and as many orbital shells as that collection actually needs. Its arrival layer now treats the SOLARIUM wordmark as faint architecture behind the system rather than ordinary navigation chrome.

It is intentionally not a dashboard. Rooms are discovered as objects in space rather than selected from a conventional menu.

## Interaction

- Move the pointer to create subtle parallax and a line back to the central light.
- Hover an anomaly to reveal its name.
- Click an anomaly to enter it.
- **Tab** to focus the stage, move the virtual cursor with **Arrow** keys (**Shift + Arrow** for larger steps), and press **Enter** or **Space** to enter the nearby anomaly.
- **1–9** jump directly to the first nine rooms, where available. A future tenth room will not require a fictional multi-digit keypress: every room is accessible through its orbiting light.
- **Esc** returns here from any room.

The arrival composition keeps metadata in the far corners, places the room invitation low and wide, and removes that treatment once a visitor enters an anomaly. The room count is generated from registered rooms; the number-key hint stops at nine. Orbital layout is adaptive: wide screens allow up to eight anomalies per shell and narrow screens up to six. Once that comfortable density is exceeded, rooms are redistributed across balanced concentric ellipses rather than being packed onto a single ring. Adjacent shells counter-rotate at slightly different speeds. If hit areas overlap, the closest anomaly to the pointer or virtual cursor wins, so activation and hover agree.

## Intent

The Atrium should feel like arriving somewhere, not opening software.

Every new room changes its orbit, so the shape of the entrance quietly records Solarium's growth.
