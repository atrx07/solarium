# The Atrium

[← Room Atlas](./README.md)

**Medium:** navigation / ambient space  
**Introduced:** 001 / GENESIS  
**Source:** [`src/rooms/atrium.ts`](../../src/rooms/atrium.ts)

The Atrium is Solarium's quiet center: one light and a growing set of anomalies moving through projected orbital space. Its arrival layer treats the SOLARIUM wordmark as faint architecture behind the system rather than ordinary navigation chrome.

It is intentionally not a dashboard. Rooms are discovered as objects in space rather than selected from a conventional menu.

## Interaction

- Move the pointer to create subtle parallax and a line back to the central light.
- Hover an anomaly to reveal its name.
- Click an anomaly to enter it.
- **Tab** to focus the stage, move the virtual cursor with **Arrow** keys (**Shift + Arrow** for larger steps), and press **Enter** or **Space** to enter the nearby anomaly.
- **1–9** jump directly to the first nine rooms, where available. A future tenth room will not require a fictional multi-digit keypress: every room is accessible through its orbiting light.
- **Esc** returns here from any room.

The arrival composition keeps metadata in the far corners, places the room invitation low and wide, and removes that treatment once a visitor enters an anomaly. The room count is generated from registered rooms; the number-key hint stops at nine.

The old flat concentric-ellipse navigation has been replaced by a small 3D projection model. Each orbital shell has its own radius, tilt, screen-plane orientation, phase, and angular velocity. An anomaly is placed on that ring in 3D, then projected into Canvas space with a bounded perspective transform. Near-side bodies grow slightly; far-side bodies shrink.

Bodies are depth-sorted around the central light. Far-side anomalies render first, then the light, then near-side anomalies, so conjunctions can actually pass behind the center instead of merely crossing a drawn ellipse. The orbital guide itself is sampled from the same projection, with its near side slightly more visible than its far side.

The layout remains adaptive: narrow screens use more, smaller shells to keep touch targets separated. Wide screens use separate horizontal and depth radii, creating a deliberately oblique side-view projection: the system expands across available width while its vertical envelope stays bounded above the arrival copy. Desktop body size is tuned independently from orbital span, so anomalies can read as defined objects without forcing the whole system to grow downward. If projected hit areas overlap, the closest anomaly to the pointer or virtual cursor wins, so activation and hover still agree.

## Intent

The Atrium should feel like arriving somewhere, not opening software.

Every new room changes its orbit, so the shape of the entrance quietly records Solarium's growth.
