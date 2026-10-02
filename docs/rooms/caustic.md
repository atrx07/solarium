# XXV · Caustic

[← Room Atlas](./README.md)

**Medium:** reflected-ray envelope / geometric optics  
**Introduced:** 023 / CAUSTIC  
**Source:** [`src/rooms/caustic.ts`](../../src/rooms/caustic.ts)

Caustic fills a circular reflective chamber with ordinary rays.

Every ray obeys the same law of reflection.

None of them is instructed to follow the bright curve that appears inside the mirror.

## Interaction

- Move around the chamber to change the incoming light direction.
- Click to lock/unlock the current light direction.
- **Space** switches between **RAYS** and **CAUSTIC** lenses.
- **R** restores the canonical light direction and rays lens.
- **Esc** returns to the Atrium.

## Ray construction

The room works in a normalized unit circle before mapping geometry to the screen.

For one shared incoming unit vector **d**, a perpendicular vector spans offsets across the beam.

For each offset `s` in the circular aperture:

```
t = sqrt(1 - s²)

entry = perpendicular(d) * s - d * t
hit   = perpendicular(d) * s + d * t
```

The ray therefore enters the near side of the circle and reaches the opposite interior wall.

At the hit point, the outward unit normal is simply the normalized hit vector.

Reflection uses:

```
r = d - 2(d · n)n
```

Because the hit lies on the unit circle, the next intersection of that reflected ray with the circle can be found directly from the reflected direction and hit position.

## The bright curve

The caustic is not authored as a Bézier path or a known closed-form curve.

The room builds the reflected ray family first.

Then, for each neighboring pair of reflected rays, it computes their forward line intersection. Intersections that lie inside the circle become samples of the ray family's local envelope.

Those samples are connected and illuminated as a visual witness.

Increasing ray density makes the sampled envelope converge toward the familiar reflected-light caustic.

The **CAUSTIC** lens suppresses most of the ray scaffolding and emphasizes the envelope; **RAYS** keeps the construction visible.

## Intent

A caustic is a collective geometric object.

It can be brighter and more visually coherent than any single ray that creates it.

No ray turns and decides to travel along the glowing curve.

The curve exists because many ordinary trajectories crowd near the same places.

That is exactly why it belongs in Solarium.
