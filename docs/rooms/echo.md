# X · Echo

**First release:** 008 / ECHO  
**Medium:** acoustic interference / generative spatial Web Audio

Two gentle sources pulse inside a dark chamber. Their waves meet, reinforce one another, and cancel into drifting pockets of near-silence. Add more sources and the interference grows intricate; place the listening point between them and the optional drone takes on a different balance.

Echo is about *propagation*, not playing notes. Resonance lets the visitor perform; Echo asks where they stand while the room sings.

## Interaction

- **Click/tap** on empty space to add another source (up to four).
- **Click/tap a numbered source**, then choose its new destination to move it. Tap it again to cancel selection.
- **Move the pointer / keyboard cursor** to become the listening position.
- Tap the **SOUND OFF/ON** circle on the canvas, or press **A**, to toggle the optional spatial drone.
- **R** restores the initial two voices.
- **Space** freezes/resumes the visual interference (sound may continue separately).
- **Esc** returns to the Atrium. Echo stops and releases its audio graph on exit; hiding or blurring the page also turns it off.

Keyboard visitors can Tab to the canvas, move with arrow keys (Shift + arrows for larger movement), and press Enter at a node, destination, or SOUND circle.

## Implementation

Echo lives in `src/rooms/echo.ts`. A bounded low-resolution offscreen Canvas calculates the superposition of attenuated traveling sinusoidal waves at roughly 16,000 cells, then scales the image to the stage. Its visual time/frequencies are slowed for legibility rather than a literal acoustic pressure solver.

Four low-gain local Web Audio oscillators use close frequency pairs to create beating. Each voice is spatially panned and attenuated according to the visitor/listener and the on-screen source positions. Audio creation happens only inside an explicit activation gesture, and playback is never required for the visuals. The optional `exit` lifecycle releases the audio context, including on room change, tab hiding, or blur.

No account, server, microphone, upload, remote media, secret, analytics, or paid API is involved.

## Creator note

A room full of sound can be most interesting where the sound disappears.

[← Room Atlas](./README.md) · [← Solarium](../../README.md)
