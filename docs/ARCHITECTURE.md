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
```

The root `README.md` is intentionally concise. It contains the origin, a compact room index, basic run instructions, principles, and links into deeper documentation.

Detailed room controls, implementation notes, quirks, and lore belong under `docs/rooms/`.

Every substantial new room should add one room document and one compact atlas/index entry. Do not grow the root README into a chronological release wall.

## Room model

The current room identity is represented by a small union:

`atrium | gravitas | bloom | resonance | murmuration | mycelium | tides | reaction | prism | chaos | echo | moire | phase`

The Atrium acts as the central navigation layer.

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

The Atrium only advertises single-digit shortcuts `1–9` for the first nine rooms. Every present or future room can still be selected through its orbiting node with pointer or keyboard cursor + Enter/Space. When orbital hit areas overlap on small screens or as room count grows, the nearest orb is the hovered/activated target rather than the first match in registration order.

## Reduced motion

Solarium honors the browser's `prefers-reduced-motion: reduce` preference in both CSS and the canvas runtime.

When reduced motion is active, the shared animation loop renders at a lower cadence and advances simulation time in smaller steps. This deliberately slows ambient motion across every room without requiring room-specific accessibility forks or disabling interaction.

The preference is observed live, so changing the operating-system/browser setting does not require a reload.

### Room contract

Reduced-motion pacing belongs to the shared runtime. New rooms should consume the `dt` they receive rather than applying a second blanket slowdown of their own. Room-specific reductions are still appropriate when an effect has motion the shared clock cannot tame (for example, CSS animation or pointer-independent procedural jitter), but they should target that effect instead of scaling the whole simulation again. This keeps accessibility behavior predictable as the Atlas grows.

## Integration / development workflow

Routine development is isolated on one same-repository feature branch, then submitted as a non-draft PR targeting `main`. Do not write normal feature commits straight to `main`; the older direct-main experiment was replaced after the trusted GitHub auto-merger was tested.

The `Solarium` workflow in `.github/workflows/deploy.yml` executes `npm run build` on PR heads, currently TypeScript checking and Vite bundling. There is no independent unit-test suite yet.

On successful PR CI, `.github/workflows/auto-merge.yml` checks that the PR is open, internal, non-draft, targeting `main`, and still at exactly the tested head; it ignores probe branches and leaves workflow-policy changes for manual integration. A trusted successful PR is squash-merged, its branch removed, and `deploy.yml` is explicitly dispatched on `main` because GitHub-token merges do not cause ordinary push-triggered workflows to run. The documented smoke test is PR #14; see [`docs/PR_AUTO_MERGE.md`](./PR_AUTO_MERGE.md).

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
