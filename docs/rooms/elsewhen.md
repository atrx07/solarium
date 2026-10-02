# XX · Elsewhen

[← Room Atlas](./README.md)

**Medium:** Lorentz geometry / relativity of simultaneity  
**Introduced:** 018 / ELSEWHEN  
**Source:** [`src/rooms/elsewhen.ts`](../../src/rooms/elsewhen.ts)

Elsewhen turns a spacetime diagram into an interactive room.

Two canonical flashes, **A** and **B**, are fixed in the chamber. In the rest frame they occur at the same time.

Change the observer's velocity and the events do not move.

What changes is the observer's definition of **now**.

## Interaction

- Drag the velocity rail to move the observer from about `-0.88c` to `+0.88c`.
- Click inside the spacetime diagram to place a temporary event.
- Click near one of your temporary events to remove it.
- **Space** returns to the rest frame.
- **C** clears temporary events.
- **R** restores the canonical room.
- **Esc** returns to the Atrium.

## Under the hood

The room uses units where `c = 1`.

For observer velocity `β = v/c`:

```
γ = 1 / sqrt(1 - β²)

x' = γ(x - βt)
t' = γ(t - βx)
```

The highlighted warm line is the moving observer's `t' = 0` simultaneity slice.

The cool line is the moving observer's `x' = 0` worldline.

The faint transformed grid is drawn by inverse Lorentz-transforming constant-`x'` and constant-`t'` lines back into the chamber's base coordinates.

The dashed diagonals are light rays. They stay invariant while the observer axes tilt.

## Intent

Most Solarium rooms evolve state.

Elsewhen does something quieter.

Nothing physical in the room needs to move for the meaning of temporal order to change.

The same two spacelike-separated events can be simultaneous in one inertial frame, while another inertial observer assigns one event an earlier time than the other.

The room is not about making time "weird."

It is about showing that **simultaneity is geometry, not a universal layer painted across the universe.**
