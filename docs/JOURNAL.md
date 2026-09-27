# Project Journal

This is Solarium's durable project memory.

It records meaningful commits, workflow runs, bugs, decisions, and creator notes. It is not a replacement for Git history; it explains the story Git history cannot.

---

## 2026-09-27 — The repository exists

### Commit
`677e888` — **Initial commit**

### What happened
Arppith created the empty public repository `atrx07/solarium`.

At this point it contained only a tiny README.

### Creator note
This was the moment the project became real enough to have somewhere to live. The absence of a detailed brief was the important part: the blankness was permission.

---

## 2026-09-27 — 001 / GENESIS

### Main commit
`f2ae2e2` — **001 / GENESIS — turn the lights on**

### What shipped
- The Atrium
- Gravitas
- Bloom
- Resonance
- responsive interface
- local visit memory
- Vite + TypeScript build
- GitHub Pages workflow
- project manifesto in the README

### Pull request
PR #1 — **001 / GENESIS — turn the lights on**

### Workflow run #1
Run ID: `36329313291`

Result: **failure**

The first PR build reached TypeScript and failed because DOM references such as the canvas/context were still considered possibly null inside callbacks despite startup guards.

### Reaction
Useful failure. The important part was that CI caught it before Genesis reached `main`.

### Workflow run #2
Run ID: `36329380810`

Result: **success**

The PR build gate passed after the TypeScript configuration was adjusted.

### Reaction
First clean proof that the actual Genesis branch built successfully.

---

## 2026-09-27 — First deployment fight

### Commit
`9f30641` — **ci: allow Pages to self-enable**

### What happened
After Genesis merged, the production build itself succeeded, but `actions/configure-pages` failed because GitHub Pages had not yet been enabled for the repository.

The workflow was changed to request Pages enablement automatically.

### Workflow run #3
Run ID: `36329411943`

Result: **failure**

Build passed. Pages configuration failed because the Pages site did not yet exist.

### Workflow run #4, attempt 1
Run ID: `36329458599`

Result: **failure**

The action attempted to create the Pages site but GitHub returned:

`Resource not accessible by integration`

The GitHub App could not perform that account-level enablement.

### Human step
Arppith opened repository settings and set:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

This was the one human-only switch needed for launch.

### Workflow run #4, attempt 2
Run ID: `36329458599`

Result: **success**

Build, Pages configuration, artifact upload, and deployment all passed.

The live environment URL became:

https://atrx07.github.io/solarium/

### Reaction
This was the real "lights on" moment. Solarium stopped being code in a repository and became a place someone could visit.

---

## 2026-09-27 — First real playtest

### Human feedback
Arppith explored the live site and spent roughly five minutes playing Resonance like a piano.

That is significant product evidence for the project's intended direction: sound + direct manipulation can produce genuine play without progression systems, accounts, scores, or instructions.

### Reaction
Resonance immediately justified the project's core premise. A room can be tiny and still hold attention if the interaction feels alive.

---

## 2026-09-27 — Gravitas violates spacetime

### Commit
`dad90bd` — **fix: stop Gravitas from violating spacetime**

### Bug report
On the live site, Gravitas immediately exploded into chaos. Click-spawned bodies shot toward the nearest edge at absurd speed.

### Root cause
`requestAnimationFrame` frame deltas were supplied in milliseconds, but the physics integrator used the raw value as though it were seconds.

At ~60 FPS, a frame delta around `16` therefore behaved like sixteen seconds of simulation time per frame.

### Fix
- convert frame delta from milliseconds to seconds,
- clamp unusually long frames before integration,
- keep the intended orbital behavior intact.

### Workflow run #5
Run ID: `36330321664`

Result: **success**

Build and deployment passed.

### Reaction
A very funny first bug, but also a useful reminder: interactive art still deserves real engineering. "Chaotic" is only interesting when the chaos comes from the system, not a unit mistake.

---

## 2026-09-27 — Solarium gets a memory

### Motivation
Arppith pointed out that relying on a single chat's context is fragile. Long project conversations eventually lose context, and a future conversation needs a durable way to recover intent and history.

### Decision
The repository itself becomes the canonical memory.

Added:

- `AGENTS.md`
- `docs/CONTINUITY.md`
- `docs/ORIGIN.md`
- `docs/CHARTER.md`
- `docs/ARCHITECTURE.md`
- `docs/JOURNAL.md`

### Rule going forward
Every meaningful Solarium change should leave enough documentation that a new chat can continue without reconstructing the project from memory.

### Reaction
This feels like the point where Solarium stops being a one-night experiment and becomes a project with continuity.


---

## 2026-09-27 — 002 / MURMURATION

### Motivation
After Genesis established gravity, a reactive field, and sound, the next missing texture was behavior that felt social rather than purely physical.

The goal was to create a room that looked alive without scripting a leader, objective, or sequence.

### What changed
- The Atrium grew from three anomalies to four.
- Added **IV · Murmuration**.
- Added a bounded boid population using alignment, cohesion, separation, edge steering, and ambient drift.
- Pointer movement acts as a gentle landmark.
- Holding the pointer makes the visitor a threat.
- Clicking sends a visible shock pulse through nearby creatures.
- **R** reseeds the population.
- The visible release label advanced from **001 / GENESIS** to **002 / MURMURATION**.

### Creator note
I wanted something that does not merely react to the visitor one particle at a time. Murmuration is the first room where the interesting object is the relationship between many small agents.

The visitor is not given a tool panel. They become part of the weather.

### Validation
PR #3 — **002 / MURMURATION — teach the light to flock**

Workflow run #8  
Run ID: `36331741216`

Result: **success**

The TypeScript/Vite build gate passed on the feature branch.

### Deployment
Main release commit: `9b11d29` — **002 / MURMURATION — teach the light to flock**

Workflow run #10  
Run ID: `36331814870`

Result: **success**

Build, Pages configuration, artifact upload, and deployment all passed.

### Status
**Live.**


---

## 2026-09-27 — 003 / MYCELIUM

### Motivation
Genesis gave Solarium physics, a field, and sound. Murmuration added collective behavior.

The next missing texture was **growth**: a room where the interesting thing is not movement through space, but a structure slowly becoming more complicated.

### What changed
- The Atrium grew from four anomalies to five.
- Added **V · Mycelium**.
- Added active growth tips with finite energy, generation depth, speed, and directional drift.
- Growth leaves bounded historical vein segments behind.
- Hovering gently bends nearby growth.
- Holding makes the visitor act like a nutrient source, strengthening attraction and extending tip life.
- Clicking plants a new spore and begins another colony.
- **R** clears and regrows the ecosystem.
- The visible release label advanced from **002 / MURMURATION** to **003 / MYCELIUM**.

### Creator note
I wanted a room that continues to make decisions after the visitor stops moving.

Mycelium is meant to feel halfway between roots, veins, lightning, and fungus without choosing one literal interpretation. The cursor is not a drawing tool. It is food, light, or weather depending on how the colony happens to meet it.

### Structural note
The single `src/main.ts` file has now earned a future modularization pass. That should happen as a dedicated architectural change rather than being mixed into a room hotfix.

### Status
Implementation complete on feature branch `solarium/mycelium`; awaiting build gate and deployment.
