# XVII · Phantom

[← Room Atlas](./README.md)

**Medium:** local car-following / stop-and-go wave emergence  
**Introduced:** 015 / PHANTOM  
**Source:** [`src/rooms/phantom.ts`](../../src/rooms/phantom.ts)

Every driver in Phantom follows an intentionally local rule:

> react to the gap and relative speed of the driver directly ahead.

No driver knows whether the whole road is flowing well. No driver knows where a jam is. No driver knows whether a wave exists.

And yet a wave can exist.

## Interaction

- Click a driver to force one short hesitation.
- Hold near the lane to create a temporary local bottleneck.
- **Space** pauses/resumes the simulation.
- **R** restores the canonical traffic state.
- **Esc** returns to the Atrium.

## Under the hood

The road is a periodic loop with 58 cars.

Each car stores only:

- position along the loop,
- current speed,
- a slightly different desired speed,
- a temporary braking timer.

Acceleration is based on a compact car-following rule inspired by the Intelligent Driver Model. A driver accelerates toward its preferred speed on open road and brakes when the available gap or closing speed makes that unsafe.

The simulation never creates a global "jam object." A faint warm ribbon is sampled from current local slowness only for visualization, and a short fading trail records the observed center of the slow region so its motion can be watched. Neither feeds back into any driver's behavior.

The simulation never creates a global "jam object."

A jam is only visible when many individually reasonable local responses line up into a coherent region of low speed and high density.

Because the cars move forward while the compression disturbance can propagate backward through the line, the room can produce the familiar **phantom traffic jam**: a travelling stop-and-go wave with no crash, roadblock, or central controller.

## Intent

Phantom is about a particular kind of emergence:

**the larger thing moves differently from the things that make it.**

Cars go forward.

The jam can go backward.
