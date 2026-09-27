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

`atrium | gravitas | bloom | resonance`

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
