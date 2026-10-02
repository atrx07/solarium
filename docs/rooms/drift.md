# XXIII · Drift

[← Room Atlas](./README.md)

**Medium:** rotating reference frames / Coriolis geometry  
**Introduced:** 021 / DRIFT  
**Source:** [`src/rooms/drift.ts`](../../src/rooms/drift.ts)

Drift launches pucks with one simple promise:

**in inertial space, they move in straight lines at constant velocity.**

The chamber then lets the visitor watch those same pucks from a rotating floor.

Nothing pushes them sideways.

The floor turns underneath them.

## Interaction

- Click inside the disc to launch a puck from the center toward the pointer.
- Click the bottom spin rail to change the turntable's angular velocity.
- Press **F** to switch between the rotating-floor frame and the inertial frame.
- Press **C** to clear all pucks.
- **Space** pauses/resumes time.
- **R** restores the canonical turntable.
- **Esc** returns to the Atrium.

## Under the hood

Each puck stores only inertial position and inertial velocity:

```
x += vx * dt
y += vy * dt
```

No Coriolis force term is applied to the puck state.

The turntable owns a frame angle:

```
theta += omega * dt
```

To render a puck in the rotating-floor frame, its inertial coordinates are rotated by `-theta`.

When a puck is launched while the floor frame is active, the chosen screen-space direction is first rotated by `+theta` into inertial coordinates, ensuring the actual velocity remains straight and constant outside the rotating frame.

Each trail sample stores both the inertial puck position and the turntable angle at that historical instant. This matters: transforming the whole trail by only the **current** angle would merely rotate a straight line. Using each sample's own historical frame angle reconstructs the genuinely curved path seen by an observer attached to the floor.

Pressing **F** changes only the rendering frame. The puck state is untouched.

## Intent

Drift is not a force simulator pretending to be a frame simulator.

The curve appears because the coordinates are rotating.

Switch to the inertial view and the mystery disappears immediately:

the puck kept going straight the entire time.
