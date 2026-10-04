# Continuity Guide

This file exists so Solarium can survive chat resets, context-window loss, model changes, and long gaps between sessions.

## Current state

Repository: `atrx07/solarium`

Live site: https://atrx07.github.io/solarium/

Default branch: `main`

Current public release family: **025 / HOLONOMY**

Current room atlas: [`docs/rooms/README.md`](./rooms/README.md)

Current rooms:

- **The Atrium** — central navigation space with orbiting anomalies.
- **I · Gravitas** — small N-body gravity sandbox.
- **II · Bloom** — reactive particle/flow field.
- **III · Resonance** — browser-synthesized spatial instrument using Web Audio.
- **IV · Murmuration** — leaderless flocking population that reacts to the visitor as landmark, threat, and disturbance.
- **V · Mycelium** — continuously growing branching colony that treats the visitor as a directional influence and nutrient source.
- **VI · Tides** — fixed-step discrete wave field with interference, cancellation, amplification, and visitor-made disturbances.
- **VII · Reaction** — Gray–Scott reaction-diffusion chemistry that self-organizes into evolving patterns from visitor-injected reagent.
- **VIII · Prism** — ray-optics chamber with circular lenses, refractive bending, spectral dispersion, and total internal reflection.
- **IX · Chaos** — seventeen nearly identical double pendulums whose tiny initial differences become visibly different futures.
- **X · Echo** — local acoustic interference field with up to four sources and optional gesture-activated stereo drone.
- **XI · Moiré** — two straight-line lattices produce perceptual curves and bands through small spacing/rotation differences controlled by the visitor.
- **XII · Phase** — seventy-two deterministic oscillators gradually synchronize through mean-field coupling while the visitor acts as a local pacemaker.
- **XIII · Polarity** — a browser-local electric field chamber where fixed signed charges shape a sampled vector field and the visitor probes the resulting force geometry.
- **XIV · Territory** — drifting sites partition the chamber by nearest proximity while the visitor temporarily competes as a ghost site.
- **XV · Threshold** — a fixed latent lattice reveals more open cells as one global threshold rises until a top-to-bottom spanning cluster suddenly appears.
- **XVI · Hysteresis** — bistable domains retain path-dependent state, so the same present field can produce different collective memory depending on the route taken.
- **XVII · Phantom** — drivers obey only local car-following rules, yet a small hesitation can organize into a backward-travelling stop-and-go wave.
- **XVIII · Trace** — agents coordinate indirectly by depositing and sensing two decaying trail fields, allowing shared routes to emerge without direct messages or a global pathfinder.
- **XIX · Avalanche** — a near-critical sandpile redistributes grains through one local toppling rule, allowing a single addition to trigger cascades across the chamber.
- **XX · Elsewhen** — a Lorentz-geometry room where changing observer velocity tilts simultaneity slices, changing the time order assigned to fixed spacelike-separated events.
- **XXI · Doppler** — a constant-frequency moving emitter produces compressed/expanded wavefront arrivals, with optional Web Audio driven by the same radial source/listener geometry.
- **XXII · Alias** — one continuously forward-spinning wheel is observed only at discrete sample times, allowing apparent slowing, stasis, or backward rotation without the underlying motion reversing.
- **XXIII · Drift** — pucks keep straight inertial velocities while a rotating render frame bends their observed paths; switching frames reveals that no sideways force was ever applied.
- **XXIV · Reprise** — a reversible four-direction lattice gas reconstructs earlier states by applying the exact inverse dynamics, with no stored frame history.
- **XXV · Caustic** — parallel rays reflect from a circular interior and collectively form a sampled geometric envelope that no individual ray follows.
- **XXVI · Monodromy** — continuous square-root continuation around a branch point exchanges the two roots after one circuit and returns only after the second.
- **XXVII · Holonomy** — a tangent vector is parallel-transported around a closed great-circle triangle and returns rotated by the spherical curvature enclosed by the loop.

The project is intentionally unfinished. New rooms should arrive when there is something genuinely interesting to add.

## Resume protocol for a new chat

When continuing Solarium from a fresh conversation:

1. Inspect the repository before making assumptions.
2. Read `AGENTS.md`.
3. Read `docs/CHARTER.md` and `docs/ORIGIN.md`.
4. Read the newest entries in `docs/JOURNAL.md`.
5. Inspect the current `main` branch and recent Actions runs.
6. Treat repository documentation as the source of truth when it conflicts with remembered chat details.
7. Continue from the current state; do not reboot the concept or re-ask foundational questions unless the docs are genuinely ambiguous.
8. After meaningful work, append a journal entry.
9. **Default integration:** review coherent work and push it directly to `main`.
10. Branches are exceptional recovery/isolation tools, not the routine workflow. If one is genuinely needed, use one canonical same-repository branch and do not create parallel retries.
11. There is intentionally **no PR CI gate and no auto-merge bot**.
12. After each meaningful `main` change, verify the exact `main` SHA and GitHub Pages deployment before calling it live.
13. `.github/workflows/deploy.yml` runs only for `main` pushes or manual dispatch and exists solely to build and publish GitHub Pages.
14. Scheduled connector write permission can still be inconsistent. When a GitHub mutation is denied by safety checks, **stop**; do not use an alternate API/Action to bypass the denial or create a shadow branch. Record what actually succeeded.

## Human / assistant relationship for this repo

Arppith owns the GitHub repository and gave Solarium broad creative freedom to the assistant.

The assistant is expected to make creative and technical decisions autonomously inside the project constraints. The human can test, react, report bugs, offer ideas, and perform account-level actions that tooling cannot perform.

The default interaction should therefore be:

- do the work first when it is safe and reversible,
- ask the human only when a genuine human-only step is required,
- do not turn every creative choice into a questionnaire.

## Hard constraints

Solarium must remain possible to build, run, host, and enjoy without spending money.

That means:

- no required paid API,
- no required subscription,
- no paid hosting requirement,
- no hidden trial dependency,
- no secret that a visitor must provide,
- no analytics requirement.

Free optional integrations may be considered later only if the core experience still works without them.

## Deployment

Hosting is GitHub Pages via GitHub Actions.

The Pages source has already been set to **GitHub Actions** in repository settings. This was a one-time human action required during Genesis.

Integration workflow:

- Direct-to-`main` is the default development path.
- Sol may review its own work before pushing; routine PR ceremony is intentionally avoided.
- A branch is used only when unfinished/risky work genuinely needs isolation or recovery.
- `.github/workflows/deploy.yml`: TypeScript/Vite build and GitHub Pages deploy from `main`, plus manual `workflow_dispatch`.
- PR builds and automatic PR integration are intentionally disabled.

Build stack:

- TypeScript
- Vite
- Canvas 2D
- Web Audio
- CSS
- browser `localStorage`

No runtime framework and no runtime dependencies are required.

## Known historical pitfall

Gravitas originally integrated animation `dt` milliseconds as if they were seconds. At ~60 Hz, values around 16 were treated as 16 seconds per frame, causing immediate orbital explosions and click-spawned bodies to shoot off-screen.

The fix converts milliseconds to seconds and clamps long frames before integration.

Do not reintroduce this bug.

## Tone and design intent

Solarium should feel discovered rather than operated.

Prefer:

- interaction over menus,
- mystery over explanation,
- ambient motion over dashboard UI,
- small surprising behaviors,
- locally generated sound and visuals,
- rooms that can be enjoyed without instructions but reward experimentation.

Avoid turning it into a productivity suite, account-based service, AI wrapper, analytics product, or conventional portfolio site.
