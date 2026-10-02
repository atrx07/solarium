# XXI · Doppler

[← Room Atlas](./README.md)

**Medium:** moving-source wave kinematics / Web Audio  
**Introduced:** 019 / DOPPLER  
**Source:** [`src/rooms/doppler.ts`](../../src/rooms/doppler.ts)

Doppler keeps one thing deliberately constant:

**the source frequency.**

The emitter moves. The listener does not need to.

Because successive wavefronts leave from different source positions, their spacing changes along the direction of motion. A listener ahead of the source receives arrivals more closely spaced; a listener behind it receives them farther apart.

## Interaction

- Click anywhere in the chamber to place the listener.
- Click **SOUND** or press **A** to enable/disable optional audio.
- **Space** pauses/resumes source motion and wave propagation.
- **R** restores the canonical source/listener arrangement.
- **Esc** returns to the Atrium.

## Under the hood

The visual emitter oscillates between two endpoints at constant speed and emits circular fronts at a constant period.

Wavefront centers are frozen at the emitter position where each front was created. Their radii then expand at one shared propagation speed.

The visual Doppler effect therefore appears geometrically:

- compressed spacing ahead of the moving source,
- expanded spacing behind it.

The optional Web Audio oscillator itself stays fixed at 220 Hz before observation.

For a stationary listener and moving source, the room estimates the observed frequency from the radial component of source velocity:

```
f_observed = f_source * c / (c - v_toward)
```

where positive `v_toward` means the source is moving toward the listener.

The listener marker flashes when a rendered wavefront actually reaches its position. Audio pitch, stereo position, and attenuation are updated from the same source/listener geometry.

Audio is off by default and starts only after a user gesture. Leaving the room closes its AudioContext.

## Intent

Nothing about the source's own note changes.

Only the spacing of what arrives changes.

That small distinction is easy to say and much easier to understand once the wavefronts are visible.
