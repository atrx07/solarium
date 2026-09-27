# VIII · Prism

[← Room Atlas](./README.md)

**Medium:** 2D ray optics  
**Introduced:** 006 / PRISM  
**Source:** [`src/rooms/prism.ts`](../../src/rooms/prism.ts)

In Prism, the visitor becomes the light source.

A fan of rays travels through drifting circular glass bodies, refracting, dispersing, and sometimes reflecting back inside the glass.

## Interaction

- Move the pointer to move the emitter.
- **Click** to add another lens.
- **Hold** to increase refractive density throughout the chamber.
- **R** restores the original lens arrangement.

The room currently caps itself at eleven lenses.

## Under the hood

Ray/circle intersections are traced geometrically. Boundaries apply Snell-style refraction between air and glass.

Each ray is traced across three nearby refractive indices to produce subtle spectral separation. When an internal ray exceeds the critical condition, the solver reflects it instead, producing total internal reflection.

## Field note

Stack enough glass around the emitter and the chamber starts producing woven circular paths.

The first name for that behavior was **"photon jalebi."**

No fix planned.

## Intent

Prism is colder and more geometric than the biological-looking rooms. You do not move the glass directly.

You move the sun.
