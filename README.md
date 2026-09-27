# SOLARIUM

> enter nothing / leave different

Solarium is a small, local-first digital place for experiments that do not need a business case.

It is not a product, an AI wrapper, a dashboard, or a SaaS starter. There is no account system, no analytics, no backend, no API key, no database, and no paid dependency hiding behind the curtain. It is simply a growing collection of interactive rooms built with browser primitives.

## 001 / GENESIS

The first release contains four spaces:

- **The Atrium** — the quiet center. Three anomalies orbit the light.
- **I · Gravitas** — a tiny N-body gravity sandbox. Add bodies and watch the system negotiate.
- **II · Bloom** — a particle field that bends around motion and briefly remembers disturbance.
- **III · Resonance** — a tiny Web Audio instrument where position becomes pitch and decay.

Nothing leaves the browser. Resonance audio is synthesized locally. Visits are remembered only with `localStorage`.

## 002 / MURMURATION

The Atrium grew a fourth anomaly.

- **IV · Murmuration** — a leaderless flock of small creatures. Move gently and they treat you like a landmark. Hold and they scatter. Click and a pressure wave passes through the population.

There is no score and no objective. The flock is the event.

## 003 / MYCELIUM

The Atrium grew a fifth anomaly.

- **V · Mycelium** — a branching colony that never waits for instructions. Hover and it bends toward you. Hold and you become food. Click and you plant a new colony.

The network keeps growing even when you do nothing.

## 004 / TIDES

The Atrium has grown a sixth anomaly.

- **VI · Tides** — a local wave field. Click to drop a stone. Hold and drag to make rain. Disturbances spread, overlap, cancel, and amplify.

It is a numerical wave system, not a particle effect.

## 005 / REACTION

The Atrium has grown a seventh anomaly.

- **VII · Reaction** — two virtual chemicals diffuse and consume each other until spots, cells, worms, coral-like fronts, and other structures emerge.
- Click to inject reagent.
- Hold and drag to paint more chemistry.
- Press **M** to change climate, **R** to sterilize, and **Space** to freeze evolution.

The pattern is generated locally from the equations. Nothing is prerecorded.

## Run it

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Controls

From the Atrium, click an orbiting anomaly or use **1**, **2**, **3**.

Inside a room, **Esc** returns to the Atrium.

Gravitas supports **R** to reset and **Space** to pause. Bloom supports **R** to reseed. Resonance wakes only after a click because browsers are, correctly, suspicious of pages that make unsolicited noises.

## Principles

1. **Free to run.** If a room needs a subscription or a metered API, it does not belong here.
2. **Local first.** Prefer browser capabilities over servers.
3. **Curiosity over utility.** A thing may exist solely because interacting with it feels interesting.
4. **No compulsory explanation.** Discovery is part of the interface.
5. **Small enough to understand.** Complexity has to earn its place.
6. **Never finished.** New rooms arrive when there is something worth adding.

## Stack

TypeScript, Vite, Canvas 2D, Web Audio, CSS, and GitHub Pages.

No runtime framework. No runtime dependencies.

## Project memory

Solarium keeps its own continuity notes in the repository so a future chat or agent can recover the project's intent without relying on conversation history.

Start with:

- [AGENTS.md](./AGENTS.md)
- [Continuity guide](./docs/CONTINUITY.md)
- [Creative charter](./docs/CHARTER.md)
- [Origin](./docs/ORIGIN.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Project journal](./docs/JOURNAL.md)

---

Solarium started because Arppith handed an empty repository to Sol and said, essentially, *go feral.*

Reasonable decision? Debatable.

Good decision? The lights are already on.
