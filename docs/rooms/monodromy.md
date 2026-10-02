# XXVI · Monodromy

> Walk once around the hole. You come back carrying the other answer.

Monodromy is a complex-analysis room built around the two-valued square root.

The left chamber is the **base plane** for a complex number `z`. The right chamber shows the two values of `w` satisfying:

```text
w² = z
```

The warm point is not recomputed from the principal square-root branch each frame. Solarium follows it by **continuous analytic continuation**.

That distinction is the whole room.

## What happens

Write `z = r · exp(iθ)`.

A continuously followed square root is `w = √r · exp(iθ/2)`.

If the visitor moves `z` once around the origin, `θ` changes by `2π`. The root angle changes by only `π`, so:

```text
w → -w
```

The base-plane point has returned to the same location, but the followed root has exchanged places with the other solution.

A second complete circuit adds another `π` to the root angle and brings the followed value home.

Nothing is randomly switched and no state is secretly replayed. The room keeps an **unwrapped argument** for `z`, so moving continuously around the branch point carries the root continuously between the two sheets.

## The branch point

The glowing point at the origin is special.

At `z = 0`, the two square roots meet, so the local distinction between the two sheets disappears. The room deliberately refuses pointer continuation through a tiny neighborhood around zero rather than pretending the branch point behaves like an ordinary coordinate.

The dashed negative real axis is a visual branch cut. Crossing it changes which conventional sheet label the continuous value occupies; the cut is bookkeeping, not a physical wall.

## Controls

- **Move inside the left plane** — move `z` while continuously following one root.
- **Click** — choose the current base-plane point directly.
- **Space** — trace one guided counterclockwise circuit at the current radius.
- **Shift + Space** — trace one guided clockwise circuit.
- **Space during a guided circuit** — cancel it.
- **C** — clear both path histories without resetting the current continuation.
- **R** — restore the canonical point and branch.
- **Esc** — return to The Atrium.

The cool point in the root plane is the other square root. It is always exactly opposite the warm followed value.

## Implementation notes

The room stores only a bounded trail plus the current radius and an **unwrapped** complex argument.

Pointer angles arrive in the usual principal interval around `[-π, π]`. Each movement contributes the shortest signed angular delta to the unwrapped argument. That lets the state accumulate `2π`, `4π`, or negative winding without an artificial jump at the branch cut.

The displayed base value uses the ordinary periodic coordinates `z = r(cos θ + i sin θ)`, while the followed root uses half of the unwrapped angle.

The branch-sheet label is derived from how many branch-cut intervals the unwrapped angle has crossed. It does not alter the mathematics; it only names the currently followed sheet.

Everything is deterministic, bounded, and browser-local.

[← Room Atlas](./README.md)
