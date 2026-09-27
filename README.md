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
