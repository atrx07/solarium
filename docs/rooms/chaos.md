# IX · Chaos

**First release:** 007 / CHAOS  
**Medium:** deterministic chaos / double pendulums

Seventeen double pendulums begin almost on top of one another. Their masses, lengths, gravity, and equations are identical. Their starting angles differ by only a microscopic amount.

Then they disagree.

The room is a small demonstration of sensitivity to initial conditions: no random force is added after launch, yet nearby states separate until the once-overlapping trajectories look unrelated.

## Controls

- **Click / Enter** — choose a new pair of starting angles from that point on the stage.
- **F** — toggle between normal time and 4× accelerated time.
- **R** — restore the canonical initial condition.
- **Space** — pause or resume the ensemble.
- **Esc** — return to The Atrium.

The lower-left readout shows the number of trajectories, the current maximum separation from the reference pendulum, and the time mode.

## Implementation

The room lives in `src/rooms/chaos.ts`.

It integrates the coupled double-pendulum equations with bounded substeps. Each of the seventeen pendulums receives only a tiny angular perturbation around a shared starting condition. Recent second-bob positions are retained in short bounded trails.

There is no server, random API, dataset, or external service involved. The entire divergence is generated locally by the equations.

## Character

Gravitas already contains orbital unpredictability, but Chaos is deliberately more confrontational about the idea.

Nothing bumps these systems apart. Nothing rolls dice behind the curtain.

They simply begin close enough to look identical, and time does the rest.

[← Room Atlas](./README.md) · [← Solarium](../../README.md)
