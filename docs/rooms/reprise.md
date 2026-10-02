# XXIV · Reprise

[← Room Atlas](./README.md)

**Medium:** reversible lattice gas / microscopic time reversal  
**Introduced:** 022 / REPRISE  
**Source:** [`src/rooms/reprise.ts`](../../src/rooms/reprise.ts)

Reprise is built around a promise:

> reverse the update rule and the current state can reconstruct its own past.

There is no stored timeline.

## Interaction

- Press **T** to reverse/restore the direction of time.
- Click inside the lattice to inject a small disturbance and declare the resulting state a new origin.
- **Space** pauses/resumes updates.
- **R** restores the canonical gas.
- **Esc** returns to the Atrium.

## State model

The chamber is a periodic 64 × 40 lattice.

Each cell is a four-bit mask representing particles travelling:

- north,
- east,
- south,
- west.

A bit is a particle. No particle stores position history.

## Forward step

One forward tick has two stages.

### 1. Collision

Exactly opposed pairs scatter into the perpendicular pair:

```
north + south  <->  east + west
```

Every other mask is unchanged.

That mapping is self-inverse.

### 2. Streaming

Each directional bit moves exactly one cell in its own direction.

The lattice wraps at the boundaries, making streaming a permutation of particle states rather than a lossy transport step.

## Reverse step

The inverse update is performed in the opposite order:

1. inverse-stream every directional particle back to the cell it came from,
2. apply the same collision map again.

Because the collision is self-inverse and the stream is a permutation, this reconstructs the previous lattice exactly.

## The origin check

Reprise does **not** keep an old lattice snapshot for playback.

It stores:

- the current lattice,
- a signed tick counter,
- a 32-bit checksum of the chosen origin state.

When the signed tick counter returns to zero, the current lattice checksum is compared with the origin checksum.

If the room says:

> Origin recovered exactly. No recording was replayed.

the recovery was produced by inverse dynamics.

A click is an external intervention, so after injecting a disturbance the room deliberately rebases that new state as tick zero.

## Intent

Most simulations throw information away somewhere:

rounding, damping, friction, deletion, randomness, boundaries, hidden state.

Reprise is a small place where the update itself refuses to forget.

The past is not stored behind the present.

For this system, the past is still encoded **inside** the present.
