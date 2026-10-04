# XXVII · Holonomy

> Return to the point. Curvature keeps the angle.

Holonomy is a curved-space room built around **parallel transport on a unit sphere**.

A warm traveler carries a tangent arrow around a closed spherical triangle made entirely from great-circle geodesics. The arrow is never deliberately twisted along the route. Each segment simply transports it as straightly as the curved surface allows.

When the traveler returns to the north pole, the point is exactly where it began — but the arrow is not.

## The triangle

The loop uses three vertices:

- the north pole,
- one fixed point on the equator,
- one visitor-controlled point farther around the equator.

The first and third edges are quarter great circles from the equator to the pole. The middle edge lies along the equator.

If the equatorial separation is `α`, the spherical triangle has angles `90°`, `90°`, and `α`. On a unit sphere its spherical excess — and therefore its enclosed area — is exactly `α` radians.

Gauss–Bonnet then gives the room its visible punchline:

```text
returned rotation = enclosed spherical area
```

So a larger triangle returns the arrow with a larger angular mismatch even though every individual segment was transported without local twisting.

## What Solarium actually computes

There is no authored “final rotation” animation.

For each geodesic edge from unit vector `p` to unit vector `q`, Solarium computes the great-circle axis `normalize(p × q)` and angle `acos(p · q)`.

A point moving along that edge is obtained by rotating `p` about that axis. The tangent arrow is parallel-transported by applying the **same 3D rotation** to the vector.

The three exact segment transports are composed in sequence. The final arrow at the north pole is compared against the original tangent vector to measure the signed holonomy.

For this particular right-right-`α` spherical triangle, the measured angle equals `α`, matching the enclosed area.

## Controls

- **Move horizontally** — change the equatorial opening angle and therefore the enclosed spherical area.
- **Click** — lock/unlock the current geometry.
- **Space** — carry the vector once around the closed loop.
- **Space while moving** — cancel the current circuit.
- **R** — restore the canonical triangle.
- **Esc** — return to The Atrium.

While the circuit runs, the arrow is shown at the traveler’s current location. When it returns, the original direction remains as a cool ghost and the transported direction appears warm beside it.

## Why it follows Monodromy

Monodromy asks how a value can return to the same base point on a different analytic sheet.

Holonomy removes the branch point entirely. The traveler returns to the same ordinary point on a smooth sphere; the mismatch comes from the geometry of the path and the curvature enclosed by it.

**Same place is still not the whole state.**

Everything is deterministic, bounded, and browser-local.

[← Room Atlas](./README.md)
