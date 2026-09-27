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

The current implementation keeps the Genesis rooms in one TypeScript entry file. This is acceptable at the current scale, but future growth should split rooms into isolated modules once the single file becomes harder to reason about.

A likely future shape:

```
src/
  core/
    stage.ts
    input.ts
    audio.ts
    navigation.ts
  rooms/
    atrium.ts
    gravitas.ts
    bloom.ts
    resonance.ts
    ...
  main.ts
```

Do not refactor into this structure merely for aesthetics. Split when it materially improves maintainability.

## Room model

The current room identity is represented by a small union:

`atrium | gravitas | bloom | resonance | murmuration | mycelium`

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

## Structural note

`src/main.ts` now contains five rooms plus the Atrium and is approaching the point where room extraction will materially improve maintainability. The next substantial architectural pass should separate room implementations without changing their behavior. Do not perform that refactor casually during a visual hotfix.

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
