# Architecture

## Overview

Solarium is currently a static single-page browser experience.

There is no backend, database, authentication system, server-rendering layer, analytics service, or required remote API.

## Runtime stack

- TypeScript
- Vite
- HTML Canvas 2D
- Web Audio API
- CSS
- `localStorage`

Development dependencies:

- TypeScript
- Vite

Runtime dependencies: **none**

## Entry points

`index.html`

Loads:

`src/main.ts`

Styles:

`src/style.css`

## Source layout

Solarium now uses an explicit room-module architecture:

```
src/
  core/
    room.ts
    stage.ts
  rooms/
    atrium.ts
    gravitas.ts
    bloom.ts
    resonance.ts
    murmuration.ts
    mycelium.ts
    tides.ts
    tides-room.ts
    reaction.ts
    prism.ts
    chaos.ts
    echo.ts
    moire.ts
    phase.ts
    polarity.ts
    territory.ts
    threshold.ts
    hysteresis.ts
    phantom.ts
    trace.ts
    avalanche.ts
    elsewhen.ts
  main.ts
  style.css
```

`src/main.ts` is intentionally an orchestrator. It owns:

- DOM shell creation,
- room registration,
- navigation,
- pointer and keyboard routing,
- resize routing,
- the animation loop,
- local visit persistence.

It does **not** own room physics, room simulation state, or room rendering.

`src/core/stage.ts` owns shared canvas state, pointer state, star-field rendering, glow rendering, coordinate conversion, and small math helpers.

`src/core/room.ts` defines the room contract and shared room/environment types.

Each room owns its own simulation state and behavior under `src/rooms/`.

Tides keeps its numerical field implementation in `tides.ts` and exposes the standard room interface through `tides-room.ts`.

## Public documentation layout

Room documentation scales independently from the repository front page:

```
docs/
  rooms/
    README.md
    atrium.md
    gravitas.md
    bloom.md
    resonance.md
    murmuration.md
    mycelium.md
    tides.md
    reaction.md
    prism.md
    chaos.md
    echo.md
    moire.md
    phase.md
    polarity.md
    territory.md
    threshold.md
    hysteresis.md
    phantom.md
    trace.md
    avalanche.md
    elsewhen.md
```

The root `README.md` is intentionally concise. It contains the origin, a compact room index, basic run instructions, principles, and links into deeper documentation.

Detailed room controls, implementation notes, quirks, and lore belong under `docs/rooms/`.

Every substantial new room should add one room document and one compact atlas/index entry. Do not grow the root README into a chronological release wall.

## Room model

The current room identity is represented by a small union:

`atrium | gravitas | bloom | resonance | murmuration | mycelium | tides | reaction | prism | chaos | echo | moire | phase | polarity | territory | threshold | hysteresis | phantom | trace | avalanche | elsewhen`

The Atrium acts as the central navigation layer.

Its HTML/CSS shell has an Atrium-specific arrival state keyed by `data-room="atrium"`. In that state, ordinary brand/room-meta chrome fades away in favor of tiny corner metadata and low, wide invitation copy. The large `SOLARIUM` wordmark is rendered inside the Atrium canvas before the orbital system. Entering any anomaly restores the normal room shell.

Atrium navigation itself uses a lightweight 3D projection implemented entirely in Canvas 2D. Each adaptive orbit has a radius, tilt, orientation, phase, and angular velocity. A room body's local orbital coordinate is rotated into a tilted plane, assigned a depth value, then perspective-projected into screen space. Projected depth also controls body scale and render ordering.

The orbit curves are sampled from the same projection instead of being authored ellipses. Far-side bodies render before the central light and near-side bodies render after it, which creates real visual occlusion at conjunction without WebGL or another runtime dependency.

Room visits are remembered locally through:

`solarium.visited`

No visit data leaves the browser.

## Gravitas

Gravitas is a simple N-body system.

It contains:

- one heavy central body,
- several lighter orbiters,
- pairwise gravitational acceleration,
- trails,
- click-spawned bodies with approximately tangential initial velocity.

Animation frame deltas arrive in milliseconds and must be converted to seconds before physics integration.

## Bloom

Bloom is a particle field driven by a changing vector-like flow rule.

Pointer motion bends the field. Holding the pointer changes the influence behavior. Clicking releases an additional burst/seed.

The room intentionally uses fading frame accumulation rather than hard-clearing every frame, producing memory-like trails.

## Resonance

Resonance uses the Web Audio API.

Horizontal position maps to a small pitch scale.

Vertical position affects decay.

Audio is generated locally and is not recorded or uploaded.

Browser autoplay rules mean the room must be awakened by explicit user interaction.

## Murmuration

Murmuration is a browser-local boid simulation.

Each creature combines:

- local alignment with nearby neighbors,
- cohesion toward a local center,
- short-range separation,
- edge steering,
- low-amplitude ambient drift,
- visitor influence.

Pointer movement acts as a weak landmark/attractor. Holding the pointer turns the visitor into a repulsive threat. Clicking creates an expanding shock pulse and gives nearby boids an outward impulse.

There is no leader object and no scripted formation. The visible flock emerges from local rules.

The simulation uses a bounded flock size and pairwise neighbor checks. Keep counts conservative enough for mobile devices before considering spatial partitioning.

## Mycelium

Mycelium is a bounded branching-growth simulation.

The state is split between active growth tips and historical vein segments.

Each growth tip carries:

- position and heading,
- growth speed,
- finite energy,
- generation depth,
- an individual phase used to perturb movement.

Growth combines low-amplitude wandering with visitor influence. Hovering produces mild directional attraction. Holding the pointer makes the visitor a stronger nutrient source, extends nearby tip energy, and increases branching pressure. Clicking plants a new spore and starts another colony.

Segments are capped to keep rendering bounded. Active tips are also capped. If every tip dies, the colony restarts from the most recent growth point rather than leaving the room permanently inert.

The visual system intentionally draws many faint generations rather than a few thick branches so the colony reads more like veins, roots, or fungal hyphae than a tree.

## Tides

Tides is the first room implemented as its own module: `src/rooms/tides.ts`.

It uses a bounded two-buffer wave simulation with a fixed 60 Hz integration step. Each cell is updated from its four direct neighbors and the previous field state, producing propagating waves that naturally interfere.

Visitor input maps to disturbances:
- click: stronger localized impulse,
- hold/drag: repeated lighter impulses,
- **R**: reset the field.

The field renders through a low-resolution offscreen canvas that is scaled to the viewport. This keeps the numerical grid reasonably small while producing a continuous surface.

## Structural direction

The modular migration is complete.

New rooms should implement the shared `RoomModule` contract under `src/rooms/`. Shared rendering/input primitives belong in `src/core/` only when they are genuinely used across rooms.

Do not put room-specific state back into `src/main.ts`.

Prefer small room-owned modules over a speculative framework. The contract stays intentionally narrow: enter, optional exit (for cleanup), resize, draw, click, and key hooks.

## Reaction

Reaction is a Gray–Scott reaction-diffusion simulation implemented as a standalone room module.

The room keeps two scalar chemical fields, **A** and **B**, on a bounded low-resolution grid. Each simulation step combines diffusion, the nonlinear reaction term `A * B²`, feed, and kill rates.

The visitor injects chemical B into the field:
- click: stronger local seed,
- hold/drag: repeated painting,
- **M**: cycle feed/kill "climates",
- **R**: restore a sterile dish with a few starter colonies,
- **Space**: pause/resume evolution.

The room renders through an offscreen canvas and scales to the viewport. Different climate presets produce materially different pattern families without changing the underlying equations.

## Prism

Prism is a modular 2D ray-optics room.

The visitor becomes the light source. A fan of rays is traced through a set of circular glass bodies. Each intersection applies a Snell-style refraction step using the current and target refractive indices.

The room also traces three nearby refractive indices per ray so dispersion appears as subtle spectral separation rather than a painted rainbow.

Behavior:
- pointer movement relocates the emitter,
- click adds another drifting glass body,
- hold raises refractive density across the chamber,
- **R** restores the initial lens arrangement.

When a ray exits sufficiently dense glass beyond the critical angle, the refractor falls back to reflection, producing total internal reflection.

Lens count and bounce count are bounded so the room stays inexpensive enough for browser rendering.


## Chaos

Chaos is a deterministic ensemble of seventeen double pendulums.

Every member begins with the same physical parameters and only a microscopic angular offset from its neighbors. The room integrates the standard coupled double-pendulum equations locally and draws the second bob's recent trajectory for each member.

The point is sensitivity to initial conditions rather than randomness: the equations remain the same while nearby beginnings become visibly different futures.

Behavior:
- click: choose a new pair of starting angles from the clicked position,
- **F**: toggle accelerated 4× simulation time,
- **R**: restore the canonical initial condition,
- **Space**: pause/resume evolution.

Integration uses bounded substeps so accelerated time remains numerically stable. Trail lengths and ensemble size are capped for predictable browser cost.

## Echo

Echo is a browser-local acoustic interference chamber. Up to four normalized source locations contribute attenuated, outward-propagating sinusoidal pressure to a bounded offscreen Canvas 2D grid (roughly 16,000 samples). Each frame sums the sources, producing shifting bright antinodes and dark cancellation lines; the visual wave rates are slowed/stylized for readability.

The visitor can tap/click to add sources (maximum four), select a source and tap a destination to move it, or reset with **R**. **Space** freezes the visual field while allowing optional sound to continue. Sources and cursor/listener position map to the same geometry for the separate Web Audio drone.

Audio is **off by default** and only starts on a user gesture (SOUND canvas control or **A** key). Four sine oscillators, individual gain/panning, and a low master gain make close frequencies beat gently; unused voices are muted. The field remains fully functional without AudioContext. Echo owns and closes its context through the optional room `exit` hook on navigation, blur, or page hide, so room-local audio cannot run after leaving.

## Moiré

Moiré is a purely local optical interference room made from two clipped batches of straight Canvas 2D line segments. Both batches have independent spacing, phase and angle. Small mismatches create the perceived larger curved/banded interference pattern; no actual curved source geometry is generated.

The visitor controls spacing and angle differences by moving the pointer. Click cycles five deterministic geometric presets; **Space** freezes time and pointer influence, and **R** restores the initial state. Line count is capped to keep GPU/CPU work bounded.

## Phase

Phase is a deterministic coupled-oscillator room based on a Kuramoto-style mean-field model.

The room currently uses 72 oscillators. Each oscillator has a fixed natural frequency and phase, while its derivative also includes attraction toward the population's complex order parameter. This avoids pairwise O(N²) coupling: each frame computes one global coherence magnitude and mean phase, then advances each oscillator from that shared field.

Visitor interaction adds a local pacemaker term whose influence falls with distance. Holding the pointer raises global coupling strength, clicking introduces a deterministic distance-shaped phase shock, **Space** pauses, and **R** reseeds the canonical initial condition.

The central hand visualizes mean phase and the coherence meter visualizes the magnitude of collective agreement. Initial positions, frequencies, and phases are deterministic and all computation remains browser-local.

## Polarity

Polarity is a browser-local electric-field chamber with up to ten fixed signed charges.

The room samples a softened inverse-square-style vector sum on a bounded grid and renders the resulting direction as small arrows. A second, coarser signed scalar sample adds faint potential speckles so regions dominated by positive or negative charges remain readable without turning the room into a heatmap dashboard.

The visitor is a probe rather than another source: pointer movement reads the local vector, while click adds alternating charges or flips the sign of a nearby existing one. **C** clears the field, **R** restores a canonical dipole, and **Space** switches between two views of the same charge configuration: **FIELD** emphasizes the directional vector grid, while **POTENTIAL** suppresses that grid and strengthens the signed scalar-potential texture.

Charge count and sampling density are bounded; no remote assets, APIs, services, or runtime dependencies are required.

## Territory

Territory is a browser-local Voronoi-style proximity chamber with twelve deterministic drifting sites by default and a cap of twenty-four.

A bounded low-resolution pass assigns each visual sample to its nearest site. While the pointer is active, it competes as one temporary ghost site, so territory can form around the visitor without mutating permanent state. A second coarser ownership pass compares neighboring samples and draws subtle boundary fragments wherever ownership changes.

Permanent sites drift slowly in normalized coordinates and reflect from soft room bounds. Click plants a permanent site or removes a nearby one, **Space** pauses site drift, and **R** restores the canonical twelve-site arrangement.

The room stores sites, not borders. Every visible border is recomputed from nearest-neighbor disagreement, keeping the concept faithful to the mathematical rule instead of turning the experience into authored polygon geometry.

## Threshold

Threshold is a deterministic site-percolation room built on a 44 × 30 lattice.

Each cell stores one pseudo-random latent value. The current global threshold determines whether that cell is open, so moving the visitor horizontally reveals more of the same underlying field rather than regenerating it.

A bounded breadth-first search starts from open cells along the top edge and marks all four-neighbor cells reachable from that boundary. If any marked cell reaches the bottom row, the chamber has formed a spanning cluster.

Click advances the deterministic latent seed, **Space** locks/unlocks the current threshold, and **R** restores the canonical field. Work is bounded by the fixed lattice size; no remote data or dependency is involved.

## Hysteresis

Hysteresis is a deterministic collection of independent bistable domains, inspired by a simple Preisach-style memory model.

Each domain has an upper switching threshold, a lower switching threshold, and one of two persistent states. When the applied field rises above the upper threshold the domain flips positive; when the field falls below the lower threshold it flips negative. Between those values the current state is retained.

Pointer x-position drives the external field from -1 to +1. Because the two switching thresholds differ, returning to the same field through a different path can produce a different collective magnetization.

The room keeps a bounded H-versus-M trace so that path dependence becomes visible as a loop rather than merely a changing texture. **Space** removes the field and holds it at zero until the pointer actually moves again, making remanence observable. Click selects another deterministic material, and **R** restores the canonical one.

Domain count and trace length are fixed, and all behavior remains browser-local.

## Phantom

Phantom is a bounded periodic traffic loop with 58 local agents.

Each car stores only its position, current speed, preferred speed, and an optional temporary braking timer. Acceleration is derived from the gap and relative speed of the car directly ahead using a compact car-following rule inspired by the Intelligent Driver Model.

There is no global jam object and no controller that decides where congestion belongs. A click briefly brakes one nearby car; holding near the lane applies a local bottleneck. The stop-and-go structure emerges from how those local responses propagate through the ordered line of cars.

The visual color of each car reflects its own current speed. A small aggregate readout is observational only and does not feed back into the simulation.

Work stays bounded by the fixed car count and browser-local state. **Space** pauses/resumes and **R** restores the canonical traffic state.

## Trace

Trace is a stigmergic colony built from 120 bounded local agents and two fixed 84 × 52 scalar trail fields.

Searching agents deposit a cool home field and sample a warm food field ahead. Returning agents do the opposite. Agents only sense short-range forward/left/right samples; when useful trail information is absent, deterministic wandering supplies exploration.

Both trail fields diffuse slightly and decay continuously. No agent stores a complete route, sees the whole source map, or communicates directly with another agent. Stable paths emerge because every traversal edits the shared environment for later agents.

Clicking plants or removes resource sources up to a small fixed cap. **C** clears both trail fields without resetting the colony, **Space** pauses/resumes, and **R** restores the canonical source layout and agents.

All state is browser-local and bounded by fixed agent/grid sizes.

## Avalanche

Avalanche is a bounded Abelian-sandpile-style redistribution system on a 54 × 36 integer lattice.

Every cell stores an integer grain count. Stable cells contain zero through three grains. At four or more grains, a cell topples: four grains leave that cell and one grain is offered to each orthogonal neighbor. Contributions that cross the outer boundary dissipate from the system.

The canonical pile is deterministic and deliberately biased toward heights two and three so the room begins close to criticality without starting unstable. Visitor clicks add one grain; holding adds grains slowly at the pointer.

Unstable cells enter a bounded work queue. The room processes only a fixed number of topplings per frame, allowing large cascades to remain visible instead of resolving synchronously between frames. Warm flashes are read-only witnesses of redistribution and do not affect the rule.

**Space** pauses/resumes redistribution and **R** restores the canonical pile. All state is local and bounded.

## Elsewhen

Elsewhen is a browser-local Lorentz-geometry room rendered entirely in Canvas 2D.

The chamber uses units where c = 1. Observer velocity is represented as β = v/c, with γ = 1 / sqrt(1 - β²). Event coordinates transform through x' = γ(x - βt) and t' = γ(t - βx).

The canonical pair of flashes is spacelike-separated and simultaneous in the base frame. Changing β leaves those events fixed but tilts the moving frame's simultaneity axis, allowing their transformed time order to change.

The warm axis is t' = 0 (the moving observer's simultaneity slice), the cool axis is x' = 0 (the observer's worldline), and faint constant-x'/constant-t' grid lines are inverse-transformed back into base coordinates. Dashed diagonals represent light rays and remain invariant.

Dragging the velocity rail changes β, clicking the diagram adds/removes bounded user events, **Space** returns to the rest frame, **C** clears user events, and **R** restores the canonical room.

The room contains no evolving simulation state beyond observer velocity and temporary event placement; its changing meaning comes from frame geometry rather than motion.

## Keyboard and focus interaction

The canvas is keyboard-focusable.

When the stage has focus:
- arrow keys move a virtual cursor,
- **Shift + Arrow** moves it in larger steps,
- **Enter** invokes the same room action as a click at the cursor position,
- **Space** does the same unless the current room already consumes Space for its own control.

The virtual cursor uses the same stage pointer coordinates that room interactions already understand, so rooms do not need separate keyboard-only simulation logic.

A visible reticle is drawn only while keyboard control is active and the canvas owns focus.

Pointer input automatically returns control to pointer mode.

The Atrium only advertises single-digit shortcuts `1–9` for the first nine rooms. Every present or future room can still be selected through its orbiting node with pointer or keyboard cursor + Enter/Space. Navigation geometry grows through adaptive orbital shells: wide layouts cap a shell at eight anomalies, narrow layouts at six, then rebalance targets across however many concentric ellipses are needed. Adjacent shells counter-rotate with slightly different angular speeds, and room-node radius stays bounded instead of growing with global room index. When hit areas overlap, the nearest orb is the hovered/activated target rather than the first match in registration order.

## Reduced motion

Solarium honors the browser's `prefers-reduced-motion: reduce` preference in both CSS and the canvas runtime.

When reduced motion is active, the shared animation loop renders at a lower cadence and advances simulation time in smaller steps. This deliberately slows ambient motion across every room without requiring room-specific accessibility forks or disabling interaction.

The preference is observed live, so changing the operating-system/browser setting does not require a reload.

### Room contract

Reduced-motion pacing belongs to the shared runtime. New rooms should consume the `dt` they receive rather than applying a second blanket slowdown of their own. Room-specific reductions are still appropriate when an effect has motion the shared clock cannot tame (for example, CSS animation or pointer-independent procedural jitter), but they should target that effect instead of scaling the whole simulation again. This keeps accessibility behavior predictable as the Atlas grows.

## Integration / development workflow

Integration depends on whether Arppith is actively present.

During an interactive chat session with Arppith, Solarium development goes directly to `main`; do not create feature branches or PRs for ordinary live work. Keep changes coherent, update project docs alongside implementation, and verify the resulting Pages deployment.

Scheduled or otherwise unattended work uses one canonical same-repository feature branch + PR as a recovery boundary. There is intentionally no pull-request CI gate and no auto-merge workflow.

`.github/workflows/deploy.yml` is deployment-only: pushes to `main` run `npm run build` (TypeScript + Vite), upload the Pages artifact, and deploy GitHub Pages. The build protects deployment health rather than acting as an approval gate.

See [`docs/INTEGRATION.md`](./INTEGRATION.md) for the current flow. Historical journal entries describing older integration experiments are intentionally archival.

Scheduled ChatGPT writes may still be denied by the connector's safety layer. Respect such denials: no alternate GitHub endpoint, Action, or shadow branch may be used to bypass them. Preserve any already-committed canonical work and report the actual blocking step.

## Deployment

Vite base path:

`/solarium/`

Production hosting:

GitHub Pages

Workflow:

`.github/workflows/deploy.yml`

Expected live URL:

https://atrx07.github.io/solarium/

## Build

```bash
npm install
npm run build
```

Local development:

```bash
npm run dev
```

## Performance philosophy

Prefer stable, inexpensive effects over maximal visual density.

Cap device pixel ratio and simulation counts when necessary.

If adding heavier rendering later, degrade gracefully on lower-power/mobile devices rather than making the site desktop-only by accident.
