# XXII · Alias

[← Room Atlas](./README.md)

**Medium:** temporal sampling / wagon-wheel aliasing  
**Introduced:** 020 / ALIAS  
**Source:** [`src/rooms/alias.ts`](../../src/rooms/alias.ts)

Alias keeps one continuous wheel spinning forward while a second view is allowed to observe it only at discrete sample times.

The sampled wheel can appear to slow, stop, or rotate backward even though the underlying wheel never reverses.

## Interaction

- Move horizontally to change the true spin rate.
- Move vertically to change the sampling rate.
- Click to lock/unlock the current control values.
- **Space** pauses/resumes time.
- **R** restores the canonical observation.
- **Esc** returns to the Atrium.

## Under the hood

The true wheel has twelve identical spokes and a continuously integrated phase.

The sampled wheel only receives a new phase whenever the sample clock fires.

Because a twelve-spoke wheel looks identical after a rotation of:

```
2π / 12
```

the apparent angular step between samples is the smallest signed displacement between equivalent spoke configurations.

That wrapped displacement is multiplied by the sample rate to estimate the apparent rotation frequency.

The important consequence is that the apparent frequency is not always the true frequency.

If the true wheel advances by slightly less than one whole spoke interval between samples, the sampled sequence appears to advance slowly.

If it advances by almost one spoke interval, successive sampled frames can look nearly identical.

If it advances by slightly more than one spoke interval, the shortest equivalent displacement points backward.

The history ghosts behind the sampled wheel are observations only. They do not affect the continuous wheel.

## Intent

Alias is about an uncomfortable observational fact:

**a measurement can be internally consistent and still tell the wrong story about the motion between measurements.**

The wheel is not confused.

The witness is undersampling it.
