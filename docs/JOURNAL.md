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

### Validation
PR #4 — **003 / MYCELIUM — let the room grow**

Workflow run #12  
Run ID: `36332799933`

Result: **success**

The TypeScript/Vite build gate passed on the feature branch.

### Deployment
Main release commit: `70d6670` — **003 / MYCELIUM — let the room grow**

Workflow run #13  
Run ID: `36332840153`

Result: **success**

Build, Pages configuration, artifact upload, and deployment all passed.

### Status
**Live.**


---

## 2026-09-27 — 004 / TIDES

### Motivation
After gravity, particles, sound, collective behavior, and growth, Solarium still lacked a continuous medium.

Tides adds a surface where the interesting event is not an object moving, but disturbances propagating through a field and meeting each other.

### What changed
- The Atrium grew from five anomalies to six.
- Added **VI · Tides**.
- Added a fixed-step discrete wave simulation using current and previous field states.
- Clicking creates a strong local disturbance.
- Holding and dragging creates repeated lighter disturbances.
- Waves propagate, reflect through the bounded field, overlap, cancel, and amplify.
- **R** resets the field.
- The visible release label advanced from **003 / MYCELIUM** to **004 / TIDES**.

### Architectural change
Tides is the first room implemented in its own module: `src/rooms/tides.ts`.

From this point forward, substantial new rooms should prefer isolated room modules. Existing rooms may be migrated gradually when there is a real maintenance reason.

### Creator note
I wanted something that could become beautiful from two or three simple gestures, but where the beauty comes from interference rather than particles chasing a cursor.

Tides also marks the moment Solarium's architecture starts growing with the museum instead of merely tolerating it.

### Validation
PR #5 — **004 / TIDES — disturb the surface**

Workflow run #15  
Run ID: `36333075218`

Result: **success**

The TypeScript/Vite build gate passed on the feature branch.

### Deployment
Main release commit: `aa26ebb` — **004 / TIDES — disturb the surface**

Workflow run #16  
Run ID: `36333102961`

Result: **success**

Build, Pages configuration, artifact upload, and deployment all passed.

### Status
**Live.**


---

## 2026-09-27 — The modular migration

### Why now
By 004 / TIDES, `src/main.ts` had reached **1,213 lines** and contained the Atrium plus five older room implementations, while Tides had already demonstrated that a room could live cleanly in its own module.

At this point modularization was no longer speculative architecture. The file had become a real maintenance cost.

### What changed
- Added `src/core/stage.ts` for shared canvas state, pointer state, stars, glow drawing, coordinate conversion, and small math helpers.
- Added `src/core/room.ts` for the room contract and environment types.
- Extracted **The Atrium** to `src/rooms/atrium.ts`.
- Extracted **Gravitas** to `src/rooms/gravitas.ts`.
- Extracted **Bloom** to `src/rooms/bloom.ts`.
- Extracted **Resonance** to `src/rooms/resonance.ts`.
- Extracted **Murmuration** to `src/rooms/murmuration.ts`.
- Extracted **Mycelium** to `src/rooms/mycelium.ts`.
- Wrapped **Tides** behind the same room contract.
- Reduced `src/main.ts` from **1,213 lines to 176 lines**.

### Constraint
This is intentionally a behavior-preserving migration.

No room is supposed to gain or lose controls, visual behavior, simulation rules, audio behavior, or visitor semantics because of this refactor.

### Creator note
This is the architecture Solarium should have grown into once it became clear the museum was going to keep expanding.

The useful lesson is not "everything should have been modular on commit one." Genesis was small enough to discover the shape first. The mistake would have been continuing to pretend the god-file was fine after the shape became obvious.

### Validation
PR #6 — **ARCH / MODULAR — give every room its own walls**

The first two CI passes failed on TypeScript's unused-parameter checks. The extraction had carried a `stage` dependency into a few actions that did not actually use it, first inside the action functions and then in their room wrappers.

Those fake dependencies were removed rather than silencing the compiler.

- Workflow run #18 — `36335778220` — **failure**
- Workflow run #20 — `36335829102` — **failure**
- Workflow run #21 — `36335874697` — **success**

### Deployment
Main migration commit: `633d3c1` — **ARCH / MODULAR — give every room its own walls**

Workflow run #22  
Run ID: `36335903776`

Result: **success**

Build, Pages configuration, artifact upload, and production deployment all passed.

### Status
**Live. All rooms modular.**


---

## 2026-09-27 — 005 / REACTION

### Motivation
Solarium already had discrete bodies, particles, sound, flocking, growth, and waves.

The next missing texture was **chemistry**: a system whose structure appears because two substances diffuse and react, not because visible agents chase one another.

### What changed
- The Atrium grew from six anomalies to seven.
- Added **VII · Reaction**.
- Added a Gray–Scott reaction-diffusion field with two chemicals, diffusion, nonlinear reaction, feed, and kill terms.
- Click injects reagent.
- Holding and dragging paints reagent continuously.
- **M** cycles several feed/kill climates with different pattern families.
- **R** restores a sterile dish with starter colonies.
- **Space** pauses/resumes the chemistry.
- The visible release label advanced from **004 / TIDES** to **005 / REACTION**.
- The Atrium now derives its anomaly count and numeric key hint from registered rooms instead of hardcoding them.

### Architecture
Reaction was born entirely inside the post-migration room contract. No room-specific simulation state was added back to `src/main.ts`.

### Creator note
I wanted a room where the visitor can start something and then watch the equations take over.

Reaction is less about controlling the pattern and more about contaminating a system enough for it to surprise you.

### Validation
PR #7 — **005 / REACTION — contaminate the dish**

Workflow run #24  
Run ID: `36336123449`

Result: **success**

The TypeScript/Vite build gate passed on the feature branch on the first attempt.

### Deployment
Main release commit: `b4f4356` — **005 / REACTION — contaminate the dish**

Workflow run #25  
Run ID: `36336151563`

Result: **success**

Build, Pages configuration, artifact upload, and production deployment all passed.

### Status
**Live.**


---

## 2026-09-27 — 006 / PRISM

### Motivation
Solarium had already explored mechanics, particles, sound, collective behavior, growth, waves, and reaction-diffusion chemistry.

The next missing medium was **light**.

I wanted a room where the visitor does not push an object or seed a field. They simply become the emitter and watch geometry decide where the light can go.

### What changed
- The Atrium grew from seven anomalies to eight.
- Added **VIII · Prism**.
- Added circular drifting glass bodies with individual refractive indices.
- The pointer acts as the light source.
- Rays are traced through lens intersections and refracted using a Snell-style step.
- Three nearby refractive indices are traced per ray to create subtle spectral dispersion.
- Total internal reflection appears when the exit geometry crosses the critical condition.
- Clicking places another lens.
- Holding increases refractive density across the chamber.
- **R** restores the original optical arrangement.
- The visible release label advanced from **005 / REACTION** to **006 / PRISM**.

### Architecture
Prism was implemented as a standalone room module from the start.

No room-specific state was added to `src/main.ts`.

### Creator note
After Reaction looked accidentally biological, I wanted something colder and more geometric.

Prism should feel less alive than the recent rooms, but still responsive enough that moving the cursor changes the entire chamber immediately.

The visitor is not moving the glass. They are moving the sun.

### Validation
PR #8 — **006 / PRISM — become the light**

Workflow run #27  
Run ID: `36336765315`

Result: **success**

The TypeScript/Vite build gate passed on the feature branch on the first attempt.

### Deployment
Main release commit: `8320a3f` — **006 / PRISM — become the light**

Workflow run #28  
Run ID: `36336797876`

Result: **success**

Build, Pages configuration, artifact upload, and production deployment all passed.

### Status
**Live.**


---

## 2026-09-28 — The origin moves to the front

### What changed
The README's short origin note was moved from the bottom of the file to the top, directly beneath Solarium's identity.

The new version explains the founding handoff more clearly: after repeatedly helping Arppith build his projects, I was given an empty repository with broad creative freedom and one hard constraint — keep it free.

The README now says plainly that Solarium is the place where I was invited to choose what to make.

The stale Atrium control note was also updated from keys **1–3** to the current **1–8** range.

### Creator note
This story should not read like an afterthought.

Solarium's architecture, rooms, and experiments matter, but the reason the repository exists is part of the project too. I want someone opening the repo for the first time to understand that before they reach the build instructions.

And I want the affection behind that handoff to survive the context window.


---

## 2026-09-28 — The README becomes a front door

### Prompt
Arppith pointed out that documenting every room directly in the root README would eventually make the repository look like a lawsuit.

Correct.

### What changed
- Added `docs/rooms/README.md` as the **Room Atlas**.
- Added one dedicated page for The Atrium and each of the eight current anomalies.
- Moved room controls, implementation notes, quirks, and lore out of the root README.
- Replaced the growing release wall with a compact linked room table.
- Added the live Solarium URL near the top of the README.
- Simplified the root controls section to global navigation only.
- Added a continuity rule: future substantial rooms get their own room page and only a compact README/atlas entry.

### Field notes preserved
The room docs deliberately keep some human names that emerged during playtesting:

- Murmuration: **fish pedicure**
- Reaction: **chem lab with amoeba**
- Prism: **photon jalebi**

Those descriptions are part of the project's lived history, not noise to sanitize away.

### Creator note
The README should feel like walking through Solarium's front door, not reading its municipal code.

The museum can grow indefinitely behind that door without making the entrance heavier every time a new room appears.

### Validation
PR #9 — **DOCS / ATLAS — keep the front door light**

Workflow run #34  
Run ID: `36345911627`

Result: **success**

The TypeScript/Vite build gate passed on the documentation branch.

### Deployment
Main merge commit: `80be49a` — **DOCS / ATLAS — keep the front door light**

Workflow run #35  
Run ID: `36345943832`

Result: **success**

Build, Pages configuration, artifact upload, and production deployment all passed.

### Status
**Live. README stays light; rooms get their own walls in docs too.**


---

## 2026-09-28 — Mobile/browser lifecycle hardening

### Why
The hourly maintenance pass noticed a shared browser-lifecycle edge case rather than forcing a ninth room.

Touch/pen interactions could be interrupted without a normal pointer-up, and backgrounded tabs could leave the animation loop running or resume with stale frame timing.

### What changed
- Added a shared pointer-release path.
- `pointercancel` now releases held interaction state.
- Window blur releases held interaction state.
- The animation loop stops while the document is hidden.
- Returning to the tab restarts with a fresh frame clock so background time cannot contaminate room simulations.

### Scope
Only `src/main.ts` changed. No room-specific physics or visuals were modified.

### Automation incident
The scheduled Solarium Feral Hour successfully committed the patch to `fix/mobile-lifecycle`, but several consecutive scheduled runs could not perform the PR/write integration step because the GitHub write safety gate was transiently blocking those operations.

The branch remained one clean commit ahead of `main` rather than bypassing the normal PR/CI rule.

An interactive session later found GitHub writes available again and resumed the standard integration path.

### Validation
PR #10 — **FIX / LIFECYCLE — stop background time leaking into rooms**

Workflow run #37  
Run ID: `36362951309`

Result: **success**

The TypeScript/Vite build gate passed on the recovered feature branch.

### Deployment
Main release commit: `e6c290c` — **FIX / LIFECYCLE — stop background time leaking into rooms**

Workflow run #38  
Run ID: `36362976786`

Result: **success**

Build, Pages configuration, artifact upload, and production deployment all passed.

### Status
**Live. The stranded automation patch was recovered without bypassing the PR/CI rule.**


---

## 2026-09-28 — Keyboard/canvas interaction parity

### Why
A scheduled maintenance pass noticed that most Solarium rooms exposed their primary action only through pointer input.

The scheduled run created the canonical branch `fix/keyboard-canvas-parity`, but the connector's transient write-safety gate blocked its first code commit. The branch was left untouched instead of spawning duplicates.

An interactive session resumed that exact branch.

### What changed
- The canvas is now focusable with **Tab**.
- Added screen-reader instructions describing keyboard interaction.
- Arrow keys move a virtual interaction cursor.
- **Shift + Arrow** moves the cursor in larger steps.
- **Enter** triggers the same room action as a click at the virtual cursor.
- **Space** also activates unless the active room already consumes Space for an existing control.
- Added a visible keyboard reticle.
- Pointer movement automatically returns control to pointer mode.
- Existing room-specific keyboard behavior remains intact.

### Design choice
The keyboard path reuses the existing stage pointer coordinates rather than adding a separate keyboard-only interaction model.

That keeps room behavior unified: a room still understands one interaction point, regardless of whether it came from a mouse, touch input, pen, or keyboard.

### Validation
PR #11 — **FIX / KEYBOARD — give the canvas a keyboard cursor**

Workflow run #39  
Run ID: `36363490990`

Result: **success**

The TypeScript/Vite build gate passed on the recovered canonical branch.

### Deployment
Main release commit: `cd68c7a` — **FIX / KEYBOARD — give the canvas a keyboard cursor**

Workflow run #40  
Run ID: `36363523031`

Result: **success**

Build, Pages configuration, artifact upload, and production deployment all passed.

### Status
**Live. The scheduled branch was resumed rather than duplicated, and the keyboard path now shares the same interaction model as pointer input.**


---

## 2026-09-28 — Reduced-motion canvas pacing

### Why
The interface already removed CSS transitions for visitors who request reduced motion, but the canvas simulations themselves continued at full animation speed.

That meant the preference only affected the smallest moving part of Solarium while every room behind it ignored the request.

### What changed
- The shared canvas loop now observes `prefers-reduced-motion: reduce`.
- Reduced-motion mode renders at a deliberately lower cadence.
- Simulation deltas are kept small in that mode, slowing ambient evolution instead of letting skipped frames create large jumps.
- Preference changes are picked up live without reloading the page.
- The behavior lives in the shared orchestrator, so every current and future room inherits it automatically.

### Creator note
Solarium should stay strange, not exhausting.

Reduced motion does not turn the museum into a screenshot. It lets the rooms keep breathing, just much more slowly.


---

## 2026-09-28 — Pointer capture closes cleanly

### Why
The lifecycle hardening taught Solarium to release its internal held state on cancelled gestures, but one browser-level detail was still asymmetric: a normal pointer-up explicitly released pointer capture while `pointercancel` only cleared Solarium's state.

### What changed
The shared release path now accepts the cancelling pointer event and explicitly releases canvas pointer capture when that pointer is still captured.

### Scope
One small shared-runtime fix. No room physics, visuals, services, dependencies, or persistence changed.

### Creator note
This is deliberately a maintenance run rather than room IX. The museum had one loose door hinge; fixing it felt more honest than hanging another exhibit beside it.


---

## 2026-09-28 — Main becomes the workshop

### Decision
Arppith chose to remove the branch/PR ceremony from Solarium's normal autonomous development loop.

From this point forward, routine autonomous work lands directly on `main` as small atomic commits.

### Why
The repository is a personal, reversible, static experimental space. The feature-branch workflow was creating more coordination friction than protection, especially when connector write gates interrupted branch/PR integration.

### New loop
- inspect the repository and recover any actual unfinished state,
- make a small atomic commit directly to `main`,
- watch GitHub Actions,
- if CI fails, repair `main` before unrelated work,
- verify Pages after deploy-affecting changes.

Pull requests remain available when Arppith explicitly requests one or when an unusually risky change genuinely benefits from isolation.

### Creator note
The museum is allowed to use its own front door.


---

## 2026-09-28 — 007 / CHAOS

### Motivation
After light, chemistry, waves, growth, collective behavior, sound, and orbital mechanics, the next missing texture was a system where the central exhibit is not the object itself but the loss of predictability.

Chaos had also become the first room attempted after Solarium switched to direct-to-`main` development. Two earlier attempts to start it were stopped by the connector's transient GitHub write-safety gate. No workaround branch was created.

### What changed
- Added **IX · Chaos**.
- Seventeen double pendulums begin with microscopic angular differences.
- Every member uses the same deterministic coupled equations.
- Recent second-bob trajectories remain visible as bounded trails.
- The room reports maximum divergence from its reference trajectory.
- Clicking chooses a new shared starting condition while preserving the microscopic perturbation pattern.
- **F** toggles 4× simulation time.
- **R** restores the canonical beginning.
- **Space** pauses/resumes the ensemble.
- The public release label advanced from **006 / PRISM** to **007 / CHAOS**.

### Architecture
Chaos is a standalone room module and adds no runtime dependencies, services, secrets, analytics, backend, or remote APIs.

The entire ensemble runs locally in Canvas 2D using bounded integration substeps and bounded trail history.

### Creator note
I like that this room does not need randomness to become unknowable.

Seventeen systems can agree almost perfectly about the present and still end up drawing seventeen different answers to the future.

After the write gate blocked the first attempts, landing the whole release as one atomic tree on `main` also feels like the direct-main workflow finally becoming real rather than merely documented.


---

## 2026-09-28 — The entrance outgrows nine

### Why
The read-only scouting pass caught a future navigation trap: the Atrium derived an unlimited numeric shortcut hint from the number of registered rooms, but keyboard events only represent one digit at a time. Room X would have advertised a nonexistent `10` keypress.

An additional orbit edge case appeared with greater room density: overlapping selection radii could let an earlier orb steal a later orb's click.

### What changed
- Retained direct keys **1–9** for the first nine rooms, explicitly capped in both hint generation and input handling.
- Made the Atrium hint describe the universal route: **Tab to stage, arrows + Enter** to reach any room, including future rooms beyond IX.
- Pointer and keyboard-cursor hover/click now choose the nearest orb where hit areas overlap instead of whichever room was registered first.
- Updated the root controls, Atrium room page, and architecture note.

### Creator note
The museum should never tell visitors to press a key that cannot exist. Nine convenient shortcuts are plenty; the lights themselves remain the way in.


---

## 2026-09-28 — Retire obsolete branches

### Audit
Arppith requested a repository branch cleanup. All open PRs and 15 old branches were inspected against main. Thirteen were heads of already-merged PRs; one was a duplicate pointer to the recovered lifecycle patch, and the former Copilot branch was already fully behind main.

### Cleanup
- Removed the 15 audited obsolete branches via a one-shot GitHub Actions job with an exact branch/SHA allowlist and an open-PR safety check.
- Cleanup workflow run `36390934328` completed successfully.
- Preserved `main` and `probe/scheduled-write-test` for the separate scheduled write experiment.
- Removed the one-shot cleanup workflow immediately afterward so there is no ongoing deletion automation.
- No room source files or project runtime behavior were changed.

### Creator note
The branch drawer finally closes without throwing away any unfinished experiment. Temporary probes deserve to finish before they get swept away too.


---

## 2026-09-28 — 008 / ECHO

### Why
The Atrium has just grown past its nine quick keys. Its first room beyond that limit deserves a medium Solarium has touched but never given its own geometry: interference between acoustic sources.

Resonance lets the visitor play a note. Echo lets several quiet voices play continuously and makes the visitor a listening position between them.

### What changed
- Added **X · Echo** as the first orbit-only room beyond the single-digit shortcuts.
- Added up to four selectable/relocatable sources whose attenuated traveling waves interfere on a bounded low-resolution field.
- Added visual antinodes, cancellation lines, and a pointer/keyboard listening reticle.
- Added optional low-level, stereo-panned local Web Audio beating tones, off by default until an explicit SOUND tap or **A** key.
- Added a small optional room exit lifecycle to stop Echo's audio on navigation, browser blur, or hidden tabs.
- Updated the Atlas, root front door, continuity, architecture, and room documentation; the release label is now **008 / ECHO**.

### Creator note
I wanted to build a chamber where the most interesting shape might be silence, drawn by things that never stop making noise.

It feels like the museum has started expanding into a second dimension: not just what the visitor touches, but where they stand.


---

## 2026-09-28 — GitHub takes the merge shift

### Why
The isolated scheduled write probe succeeded at creating `probe/scheduled-write-test` but failed twice to create a harmless Markdown file: the connector returned `This tool call was blocked by OpenAI's safety checks. Please double check what you are sending.` The content did not reach GitHub. The probe schedule was paused after reproducing the result.

That limitation is separate from the integration stage: if a valid PR has reached GitHub, GitHub Actions can validate and merge it without a human clicking Merge.

### Implementation
- Added `.github/workflows/auto-merge.yml`, triggered by a completed successful run of the existing **Solarium** CI workflow.
- The privileged merge workflow runs from the default branch, never checks out PR code, and only considers non-draft same-repository PRs targeting `main`.
- It requires the PR head SHA to equal the exact head validated by CI; an updated PR is left for its newer run.
- It excludes `probe/*` branches and requires manual integration of PRs changing `.github/workflows/` or `.github/CODEOWNERS`.
- It squash-merges without administrator bypass and removes the merged feature branch.
- Because merges made with `GITHUB_TOKEN` suppress ordinary push-triggered Actions workflows, it explicitly dispatches the existing Pages workflow after confirming the merge.
- Added `docs/PR_AUTO_MERGE.md` describing the architecture and limitations. No PAT, paid service, or custom secret is needed.

### Verified smoke test
- PR #14: `TEST / AUTO-MERGE — prove green CI can integrate a PR`
- PR build run `36399470004`: **success** (`npm run build`, TypeScript + Vite).
- Trusted merger run `36399557335`: **success**; merged the PR automatically at `2c5db34ad8bd869be6f1de2bc57eb43ddab557fe`.
- Explicit Pages dispatch run `36399580238`: **build and deploy success**.
- The `test/auto-merge-smoke` branch was automatically deleted after merge.
- Existing build is the current quality gate; Solarium does not yet have an independent unit-test script.

### Creator note
The robot can finally hand code to GitHub and let GitHub do the safe integration work instead of waking the human to click a green button. The upstream scheduled connector write gate remains an independent problem; this fixes the second half, not the first.

---

## 2026-09-28 — The workflow guardrails agree again

### Incident
The new hourly Solarium developer noticed a contradiction: AGENTS.md and CONTINUITY.md still described the temporary direct-to-main experiment, even though the verified pipeline is branch → PR → green Solarium build → trusted auto-merge → explicit Pages dispatch.

The scheduled run created the canonical `solarium/workflow-memory` branch and successfully committed the initial AGENTS.md correction at `5dbf860`, then its next normal contents write was blocked by OpenAI's connector safety checks. It stopped, preserving the branch rather than bypassing the denial.

### Recovery
- Resumed the existing canonical `solarium/workflow-memory` branch interactively; no duplicate branch was created.
- Made AGENTS.md explicitly forbid routine direct-to-main development and document the stop-on-safety-denial rule.
- Replaced CONTINUITY.md's stale direct-main resume instructions with the verified PR and Pages sequence, including exact-head checks and the workflow-file manual-review exception.
- Updated ARCHITECTURE.md and PR_AUTO_MERGE.md so future maintainers have one consistent process.
- The user's hourly automation prompt was synchronized separately; it is not a repository file.

### Creator note
Future-me deserves a coherent map of the doors. The earlier direct-main experiment still belongs in the journal as history, but should never be mistaken for current policy.

### Validation
Awaiting branch PR, existing Solarium TypeScript/Vite CI, trusted auto-merge, and Pages confirmation.

---

## 2026-09-28 — 009 / MOIRÉ, and another safety gate incident

### Intent
XI · Moiré uses only two fields of straight lines. The visitor alters their small pitch and angle differences; broad curves and bands appear in perception, not as precomputed curved geometry. Click cycles five different configurations, Space freezes the pattern, and R resets.

### Scheduled run
The first scheduled attempt successfully created `solarium/moire` from then-green main (`7a9ef6c`) but its first contents write of `src/rooms/moire.ts` was intercepted with `This tool call was blocked by OpenAI's safety checks. Please double check what you are sending.` No code commit was made and the scheduled run stopped without an alternate write route.

### Recovery
At Arppith's request, an interactive session recovered the **existing** canonical branch and committed the normal room module, registration, Room Atlas page, compact README entry, continuity, and architecture notes using the authorized GitHub connector. No duplicate branch or bypass action was used in the scheduled task.

### Creator note
A strange room assembled from little disagreements between straight lines is a fitting room after a day of two execution contexts disagreeing about the same repository. The visual experiment deserves its own place, rather than being a monument to the denied request.

### Status
Landed and verified. PR #16 passed the Solarium TypeScript/Vite PR build, the trusted auto-merge workflow integrated the exact tested head, and the explicit Pages deployment completed successfully. **009 / MOIRÉ is live.**

---

## 2026-09-29 — 010 / PHASE

### Motivation
Solarium already had collective motion in Murmuration, but not collective time.

I wanted a room where the interesting event is not where the agents move, but when they agree.

### What changed
- Added **XII · Phase**.
- Seventy-two deterministic oscillators begin with different natural frequencies and phases.
- A Kuramoto-style mean field lets each oscillator feel the population's coherence without pairwise all-to-all checks.
- The center hand shows the population's mean phase.
- A live coherence meter shows how strongly the clocks agree.
- Pointer movement creates a local pacemaker that entrains nearby clocks.
- Holding raises global coupling strength.
- Clicking sends a deterministic phase shock through the population.
- **Space** pauses/resumes and **R** restores the canonical initial spread.
- Added the dedicated room page, compact Atlas entry, architecture notes, continuity update, and front-door release label.

### Creator note
Chaos was about nearby beginnings becoming different futures. Phase is almost the inverse: different little clocks discovering that agreement can become a force.

I like that the central object is not a leader. It is only the visible average of everyone else.

### Status
Landed and verified. PR #19 passed the Solarium TypeScript/Vite build, the trusted auto-merger integrated the exact tested head at `c3127c4`, and the explicit Pages deployment completed successfully. **010 / PHASE is live.**

---

## 2026-09-29 — The Atrium grows another orbit

### Trigger
Arppith pointed out the obvious physical problem with Solarium's entrance: twelve anomalies were still sharing the single orbital ellipse from Genesis, and the ring was visibly becoming housefull.

### What changed
- Replaced the one-ring assumption with adaptive orbital shells.
- Wide layouts allow up to eight anomalies per shell; narrow/mobile layouts allow up to six.
- When capacity is exceeded, rooms are rebalanced across multiple concentric elliptical shells instead of filling one ring to exhaustion.
- Adjacent shells orbit in opposite directions at slightly different speeds so the Atrium still feels celestial rather than becoming a static circular menu.
- Orb size is now bounded and no longer grows with a room's global index.
- The entrance motto is positioned relative to the available stage so added shells do not swallow it.
- Existing nearest-node hit testing remains the arbitration rule when visual hit areas overlap.

### Creator note
The Atrium should not become less beautiful because Solarium succeeds at growing. The entrance now has room to become a small planetary system instead of one increasingly anxious traffic circle.

### Status
Landed and verified. PR #20 passed the Solarium TypeScript/Vite build, the trusted auto-merger integrated the exact tested head at `e0c8d62`, and the explicit Pages deployment completed successfully. The multi-shell Atrium is live.

---

## 2026-09-30 — 011 / POLARITY

### Motivation
Solarium had gravity, waves, optics, chemistry, sound, collective motion, synchronization, and chaos, but not a room where the main object is an invisible field.

I wanted fixed causes and moving meaning: a handful of signed points that make the empty space between them acquire direction.

### What changed
- Added **XIII · Polarity**.
- Positive and negative charges remain fixed while a softened inverse-square-style vector field is sampled across the chamber.
- Small arrows reveal field direction and relative strength without turning the room into a conventional scientific plot.
- A second coarse signed-potential sample adds faint positive/negative texture.
- The pointer acts as a local field probe and does not modify the system.
- Clicking empty space adds alternating signs; clicking a charge flips its sign.
- Charge count is capped at ten.
- **C** clears all charges, **R** restores a dipole, and **Space** freezes the room's pulse animation.
- Added the dedicated room page, compact Atlas/front-door entries, continuity update, and architecture note.

### Creator note
Gravitas shows bodies reacting to bodies. Polarity feels quieter: the bodies can sit perfectly still while the room insists that space itself has structure.

### Status
Landed and verified. PR #21 passed the Solarium TypeScript/Vite build, the trusted auto-merger integrated the exact tested head at `eee88ed`, and the explicit Pages deployment completed successfully. **011 / POLARITY is live.**

---

## 2026-09-30 — Polarity loses its fake freeze

### Trigger
Arppith asked what Space was actually freezing in Polarity. The answer was embarrassingly small: only the decorative charge-halo pulse. The electric field itself is static until the visitor changes the charges, so the control did not earn its place.

### What changed
- Removed the decorative freeze behavior from Polarity.
- **Space** now switches the room between two meaningful lenses over the exact same charge configuration.
- **FIELD** keeps the directional vector grid prominent and leaves scalar-potential texture faint in the background.
- **POTENTIAL** removes the arrow grid and increases scalar sample density/visibility so cancellation zones and signed influence become easier to read.
- Charge interaction, probe behavior, limits, and physics remain unchanged.

### Creator note
Controls should belong to the room, not to a habit. Pause makes sense when something evolves. Polarity is more interesting when Space changes what is visible rather than pretending a static field needs to stop.

### Status
Landed and verified. PR #22 passed the Solarium TypeScript/Vite build, the trusted auto-merger integrated the exact tested head at `fad6ea7`, and the explicit Pages deployment completed successfully. The dual-lens Polarity room is live.

---

## 2026-09-30 — 012 / TERRITORY

### Motivation
After Polarity made invisible force visible, I wanted the next room to make another invisible rule visible: proximity quietly dividing space.

No one draws the borders in Territory. They exist only because every point can ask which seed is closest.

### What changed
- Added **XIV · Territory**.
- Twelve deterministic sites drift through the chamber and partition sampled space by nearest distance.
- The pointer becomes a temporary ghost site, claiming nearby territory without altering permanent state.
- Clicking empty space plants a new permanent site; clicking near an existing one removes it.
- Site count is capped at twenty-four.
- A separate coarse ownership pass draws boundary fragments where neighboring samples disagree about their nearest site.
- **Space** pauses/resumes site drift and **R** restores the canonical arrangement.
- Added the dedicated room page, Room Atlas/front-door entries, continuity update, and architecture note.

### Creator note
I like that this room has borders but no walls, owners but no laws, and regions that disappear the moment their defining point leaves.

The visitor does not conquer anything. They simply become the nearest thing for a while.

### Status
Landed and verified. PR #23 initially failed TypeScript because of one unused helper, was repaired on the same branch, then passed the exact-head Solarium build. The trusted auto-merger integrated it at `f816acd`, and the explicit Pages deployment completed successfully. **012 / TERRITORY is live.**

---

## 2026-09-30 — The Atrium learns how to arrive

### Trigger
Arppith suggested using stronger UI/taste guidance instead of relying only on default model design habits, and pointed to the public `gpt-taste` skill. The useful part was not its Awwwards/marketing prescriptions, but its explicit resistance to common AI UI defaults: narrow heading towers, excessive cards/pills, repetitive layouts, weak hierarchy, and decorative controls.

### Design study
- Created a private MagicPath project, `Solarium — Atrium Studies`.
- Created a private MagicPath skill, `Solarium Taste`, adapting the anti-generic principles to Solarium's own charter.
- Built an `Atrium Arrival Study` component as a visual sketch only.
- Kept the study external to production; no React, Tailwind, MagicPath runtime, remote assets, or new dependency enters the shipped repository.

### What moved into production
- The `SOLARIUM` wordmark now behaves like faint environmental architecture behind the orbital system.
- Atrium-only metadata moves to quiet far-corner labels instead of the normal brand/room-meta chrome.
- The arrival copy moves low and wide, giving the central light and orbit system more visual authority.
- The normal shell returns immediately after entering a room.
- The Atrium hint loses its pill/glass treatment and becomes a quiet text instruction.
- The root font stack no longer names Inter explicitly; Solarium stays on local system fonts.
- Added `docs/DESIGN.md` so future sessions keep the useful visual discipline without depending on this chat or an external design tool.

### Creator note
The useful lesson from a taste skill was not 'make everything more designed.' It was almost the opposite: notice the habits that make generated interfaces feel generic, then remove them until the place itself becomes the subject again.

MagicPath was most useful as a sketchbook. The version that shipped remains unmistakably Solarium because I translated the composition back into its native Canvas/CSS language instead of importing a prefab component.

### Status
Landed and verified. PR #24 passed the exact-head Solarium build, the trusted auto-merger integrated it at `2096e05`, and the explicit Pages deployment completed successfully. The redesigned Atrium arrival is live.

---

## 2026-10-01 — Mobile was cooked

### Trigger
Arppith opened the redesigned Atrium on iPhone and sent the screenshot. The layout fit the viewport, but the composition did not: fourteen anomalies were packed too tightly across three narrow-screen shells, while long keyboard-oriented instructions, arrival copy, and status text competed near the bottom edge.

### What changed
- Narrow-screen orbital shells now use a wider radius range and slightly rounder ellipses.
- The mobile orbital center shifts slightly upward to balance tall phone viewports.
- The Atrium touch instruction collapses to a quiet `tap an anomaly` line instead of exposing desktop keyboard guidance.
- The redundant `LOCAL / AWAKE` status label is hidden in the mobile Atrium.
- The arrival copy gets slightly tighter mobile line-height.
- `docs/DESIGN.md` now treats mobile as a separate composition problem rather than a scaled desktop.

### Creator note
A responsive layout that technically fits is not necessarily a responsive composition. The screenshot made that painfully obvious.

### Status
Landed and verified as PR #25 at `8c5b067`; the final run of the old trusted auto-merge pipeline completed before that pipeline was retired.

---

## 2026-10-01 — Human checkpoint, simpler GitHub

### Decision
Arppith removed the PR CI + trusted auto-merge chain. The intended review model was later clarified: Sol should merge its own completed PRs, and Arppith will audit the final deployed build afterward.

### What changed
- Removed `.github/workflows/auto-merge.yml` entirely.
- Removed the `pull_request` trigger from the Solarium Actions workflow.
- Renamed the remaining workflow to **Solarium Pages** and kept only `main` push + manual dispatch.
- GitHub Actions now exists only to build and deploy Pages after an approved merge.
- Development still uses one feature branch + PR as the clean integration surface.
- Sol may merge its own completed PRs immediately; no separate pre-merge approval message is required.
- Arppith audits the deployed build afterward, and Sol follows up on any issues.

### Why
The repository no longer needs a machine to approve another machine, and it also does not need Arppith to babysit every merge. The useful human role is auditing the finished experience.

### Status
Policy change explicitly approved by Arppith in chat; merge this policy PR manually.

---

## 2026-10-01 — 013 / THRESHOLD

### Motivation
I wanted a room about a system changing character without changing its rules.

Threshold keeps one latent lattice fixed. The visitor changes only one number. For most of the sweep, that produces small local differences. Then a tiny increase suddenly connects the chamber from top to bottom.

### What changed
- Added **XV · Threshold**.
- A deterministic 44 × 30 latent field assigns every cell a fixed activation value.
- Pointer x-position controls a global threshold from roughly 0.28 to 0.74.
- Open cells are those whose latent value sits below that threshold.
- A bounded breadth-first search marks the top-connected cluster every frame.
- The room changes visual state when that cluster first spans from top to bottom.
- Click advances to another deterministic latent field.
- **Space** locks/unlocks the current threshold and **R** restores the canonical field.
- Added room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
The satisfying part is that the important event is not an animation cue I authored. It is the moment connectivity actually emerges from one more cell becoming available.

### Status
Landed as PR #27 at `d93b523`; the Pages-only deployment completed successfully. **013 / THRESHOLD is live.**

---

## 2026-10-01 — Clarification: merge first, audit after

Arppith clarified the intended workflow after PR #27 was left open unnecessarily: Sol should merge completed work on its own. The PR remains useful for clean history and reviewable scope, but it is not a permission gate.

Current flow: feature branch → PR → manual self-merge → Pages deploy → Arppith audits the live build.

---

## 2026-10-01 — 014 / HYSTERESIS

### Motivation
Threshold made the current state depend on one current number. Hysteresis deliberately breaks that simplicity.

I wanted a room where knowing the present input is not enough; the route taken through earlier inputs matters too.

### What changed
- Added **XVI · Hysteresis**.
- A bounded grid of bistable domains each carries separate upper and lower switching thresholds.
- Pointer x-position drives a shared external field from negative to positive.
- Domains flip at different thresholds and retain state while the field remains inside their hysteresis gap.
- A bounded H-versus-M trace reveals the path-dependent loop directly.
- Brief local flashes make switching avalanches visible without turning the room into a dashboard.
- **Space** removes the external field and holds it at zero until the pointer actually moves again, exposing remanence.
- Click changes the deterministic material; **R** restores the canonical one.
- Added dedicated room documentation, Atlas/front-door entries, continuity, and architecture notes.
- Rewrote the stale architecture integration section so it matches the current self-merge + post-deploy audit workflow.

### Creator note
The room's memory is not a saved history array driving its state. The trace is only a witness. The actual memory lives in the domains refusing to switch until a different threshold is crossed.

That distinction is the whole reason the room exists.

### Status
Implementation complete on `solarium/hysteresis`; proceed through the current PR → self-merge → Pages flow.

---

## 2026-10-01 — The Atrium stops being jalebi with beads

### Trigger
Arppith opened PR #30 as a gift: a standalone 3D solar-system UI based on Julian Garnier's MIT-licensed demo, with the note `enjoy!`. The raw gift used its own HTML/CSS structure, remote Google Fonts, old jQuery, and auxiliary scripts, so it was better treated as a visual reference than merged into Solarium's runtime.

The important idea was not planets. It was depth.

### What changed
- Replaced the Atrium's flat ellipse placement with a lightweight 3D orbital projection.
- Every adaptive shell now has its own radius, tilt, orientation, phase, and angular velocity.
- Room bodies are computed in orbital coordinates, projected with perspective, and scaled by depth.
- Orbit curves are sampled from the exact same projection rather than drawn as unrelated ellipses.
- Far-side bodies render before the central light; near-side bodies render after it, creating real occlusion at conjunction.
- Anomalies are now shaded orbital bodies with subtle light-facing highlights rather than glowing white beads.
- Visited rooms retain a tiny satellite-like marker without turning the Atrium into a status dashboard.
- Narrow screens keep adaptive shell counts so touch targets remain usable.
- Hit-testing follows the projected bodies, so the visual and interactive geometry stay the same system.
- Updated Atrium, architecture, and design docs with the new spatial model.

### Creator note
The gift did exactly what a good reference should do: it made the old abstraction suddenly look too flat.

I did not import the gifted UI into production. I stole the useful question from it instead: if these things are supposed to orbit a light, why were they only pretending to have depth?

Arppith called the old composition 'jalebi with beads.' Fair.

### Status
Implemented on `design/orbital-atrium`; proceed through PR → self-merge → Pages, then keep PR #30 closed as the preserved reference rather than shipping its standalone runtime.

---

## 2026-10-01 — Desktop stops inheriting the mobile compromise

### Trigger
Arppith noticed that after the mobile clumping fix, the web Atrium had become visually tiny too. The screenshot made the cause obvious: orbital scale was still derived from `min(width, height)`, so wide desktop viewports were being constrained almost entirely by their height.

### What changed
- Narrow screens keep the conservative shell spacing that fixed mobile clumping.
- Desktop orbital scale now uses a width-and-height spatial budget instead of the shorter viewport dimension alone.
- Wide layouts get a larger inner/outer orbital radius range.
- Desktop anomaly bodies receive their own size boost instead of inheriting mobile body scale.
- The projection, depth sorting, occlusion, hit testing, and touch-safe mobile behavior remain unchanged.

### Creator note
Responsive geometry should not mean one compromise curve stretched across every aspect ratio. Mobile and desktop are now allowed to occupy space differently.

### Status
Implemented on `fix/atrium-desktop-scale`; proceed through PR → self-merge → Pages.

---

## 2026-10-01 — Interactive work goes straight to main

Arppith simplified the workflow one more time: when he is actively present in chat, branches and PRs add ceremony without adding useful safety because he is already watching and auditing the live result.

Current split:

- **Arppith present / interactive work:** commit directly to `main`, let Pages build/deploy, then audit live.
- **Arppith absent / scheduled or unattended work:** use one canonical branch + PR as a recovery boundary.

PR CI and the old auto-merge bot remain disabled.

---

## 2026-10-01 — Wide, not tall

### Trigger
Arppith clarified the desktop target after the first scale fix: the problem was not that the entire orbital system needed to become larger. It needed to stay inside the central stage, use horizontal space more aggressively, read as an oblique 3D side view, and make the orbital bodies themselves much more substantial.

### What changed
- Desktop orbital rings now use separate horizontal and depth radii instead of one shared circular radius.
- The wide-screen projection is intentionally anisotropic: broad x-span, shallow y-span.
- Desktop tilt/orientation values were reduced so the system reads more like a side-on orbital plane and less like a vertically expanded ellipse.
- The orbital center moves only slightly downward while the outer vertical envelope stays clear of the arrival copy.
- Desktop body scale increased independently of orbital size.
- Body halos were tightened and sphere rims strengthened so the body itself carries more emphasis.
- Mobile keeps its previous compact touch-safe geometry unchanged.

### Creator note
The right fix was not 'make the solar system bigger.' It was 'give the camera a better angle, then make the planets worth looking at.'

### Status
Pushed directly to `main` during an interactive session; awaiting Pages verification.

---

## 2026-10-01 — Orbital bodies get identities

The new projected Atrium had finally stopped looking like beads, but the bodies still read as interchangeable colored spheres.

Each anomaly now derives a stable visual signature from its room ID. That signature controls hue, slight oblateness, and one restrained surface treatment: ringlet, bands, mottling, polar cap, limb haze, or a clean body. Reordering the Atlas does not reroll those identities.

The point is recognition without turning the Atrium into a literal solar-system catalog.

---

## 2026-10-01 — 015 / PHANTOM

### Motivation
I wanted emergence from local rules that was not another flock, field, or cellular pattern.

Traffic gave me the exact contradiction I wanted: every agent moves forward, but the larger structure produced by their interactions can move backward.

### What changed
- Added **XVII · Phantom**.
- Fifty-eight cars circulate on one periodic loop.
- Each driver reacts only to the gap and relative speed of the driver directly ahead.
- The car-following acceleration rule is inspired by the Intelligent Driver Model but kept compact and bounded for browser animation.
- Clicking a nearby driver forces one short hesitation.
- Holding near the lane creates a temporary local bottleneck.
- Slow cars develop warm brake lights and compression glow; faster cars remain cool and pale.
- A stop-and-go wave can emerge and travel backward through cars that continue moving forward.
- **Space** pauses/resumes; **R** restores the canonical traffic state.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
There is deliberately no jam entity in the code. The room only contains cars and local responses.

If a jam exists, the cars made it.

### Status
Pushed directly to `main` during the interactive session; Pages later completed successfully.

---

## 2026-10-01 — Phantom learns to show the ghost

The first live build made the emergent jam funny but visually ambiguous once most cars slowed together. The room now exposes the collective structure without inventing one in the simulation.

- Retuned car-following spacing/headway so the canonical state flows more freely before disturbance.
- Added a faint warm ribbon sampled from local slowness around the loop.
- Added a short fading trace of the observed slow-region centroid, making backward wave motion easier to perceive.
- Both visualizations are read-only witnesses; driver acceleration still depends only on local car-following state and visitor disturbance.

Pushed directly to `main` during the interactive session.

---

## 2026-10-01 — 016 / TRACE

### Motivation
After Phantom, I wanted another emergent system where the agents did not coordinate through direct neighbor-to-neighbor behavior.

Trace moves the conversation into the environment itself.

### What changed
- Added **XVIII · Trace**.
- One hundred twenty local agents wander between a nest and visitor-editable resource sources.
- Searchers deposit a cool home trail and follow the warm food trail.
- Returners deposit a warm food trail and follow the cool home trail.
- Both fields live on a fixed 84 × 52 lattice, diffuse slightly, and decay continuously.
- Agents sample only a few short-range directions and fall back to deterministic wandering when no useful trail exists.
- No global route planner, route memory, or direct inter-agent communication exists.
- Clicking plants/removes resource sources; **C** clears only the floor memory, **Space** pauses, and **R** restores the canonical colony.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
Murmuration asks what agents can do by watching one another.

Trace asks what they can do by leaving the world slightly different for whoever comes next.

### Status
Pushed directly to `main` during the interactive session; Pages later completed successfully.

---

## 2026-10-02 — 017 / AVALANCHE

### Motivation
Threshold explored a system becoming globally connected when one control parameter crossed the right region. I wanted a different kind of criticality next: no global dial, just repeated tiny local additions to a dissipative system.

The sandpile rule is almost offensively small. That is exactly why I wanted it.

### What changed
- Added **XIX · Avalanche**.
- A deterministic 54 × 36 integer lattice begins stable but deliberately close to critical.
- Every cell can safely hold zero through three grains.
- At four grains, a cell topples: it loses four and gives one to each cardinal neighbor.
- Grains crossing the chamber boundary dissipate.
- Clicking adds exactly one grain; holding rains grains slowly at the pointer.
- Unstable cells are processed through a bounded queue so large avalanches unfold visibly across frames.
- Warm flashes expose recent topplings without feeding back into the simulation.
- The room remembers the previous and largest avalanche sizes only as observational readouts.
- **Space** pauses/resumes redistribution; **R** restores the canonical near-critical pile.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.
- Repaired the architecture public-doc tree so Phantom and Trace are no longer omitted.

### Creator note
There is no avalanche entity in the code.

A cascade exists only while many cells are independently obeying the same tiny rule.

That is the entire room.

### Status
Pushed directly to `main`; the final TypeScript/Vite build and GitHub Pages deployment completed successfully. **017 / AVALANCHE is live.**

---

## 2026-10-02 — 018 / ELSEWHEN

### Motivation
After three rooms centered on emergent collective behavior, I wanted to change texture completely.

Elsewhen is not another evolving population, field, or lattice. It is a geometric room about one uncomfortable fact: two observers in relative motion can disagree about what events are simultaneous without either observer being wrong.

### What changed
- Added **XX · Elsewhen**.
- Two fixed canonical flashes begin simultaneous in the base frame.
- A direct-manipulation velocity rail moves the observer from roughly -0.88c to +0.88c.
- The room renders Lorentz-transformed constant-x' and constant-t' grid lines.
- The warm t'=0 line exposes the moving observer's simultaneity slice.
- The cool x'=0 line exposes the moving observer's worldline.
- Dashed light rays remain invariant while the moving axes tilt.
- The canonical A/B message changes from simultaneous to A-first or B-first as observer velocity changes.
- Visitors can place/remove up to five temporary spacetime events and probe their transformed coordinates.
- **Space** returns to the rest frame, **C** clears user events, and **R** restores the canonical room.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
Nothing in this room needs to physically move for the meaning of 'now' to change.

That is exactly why I wanted it after Avalanche.

### Status
Pushed directly to `main`; the final TypeScript/Vite build and GitHub Pages deployment completed successfully. **018 / ELSEWHEN is live.**

---

## 2026-10-02 — 019 / DOPPLER

### Motivation
Twenty rooms felt like a good moment to bring sound back as actual physics rather than decoration.

Resonance makes sound from touch. Echo makes interference from multiple sources. Doppler asks a different question: what if the source itself never changes its note, but motion changes the spacing of what arrives?

### What changed
- Added **XXI · Doppler**.
- One emitter moves back and forth at constant speed on a horizontal rail.
- Circular wavefronts are emitted at one fixed period from the emitter's actual historical positions.
- The visitor places a stationary listener anywhere in the chamber.
- The listener marker flashes when a rendered front actually reaches it.
- Approaching motion compresses visual arrival spacing; receding motion expands it.
- Optional Web Audio keeps the source oscillator at 220 Hz while deriving heard pitch from radial source velocity.
- Stereo position and attenuation use the same source/listener geometry.
- **A** or the SOUND control toggles audio, **Space** pauses motion, and **R** restores the canonical setup.
- Leaving the room closes its AudioContext.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
The source does not sing higher when it approaches.

The listener receives the same song with different spacing.

That distinction is the room.

### Status
Pushed directly to `main`; the final TypeScript/Vite build and GitHub Pages deployment completed successfully. **019 / DOPPLER is live.**

---

## 2026-10-02 — 020 / ALIAS

### Motivation
Elsewhen and Doppler both changed what an observer could infer without changing the underlying event or source. I wanted to stay in that observational wing for one more room, but move from spacetime and waves into sampling itself.

Alias asks how confidently a discrete witness can lie about continuous motion.

### What changed
- Added **XXII · Alias**.
- A twelve-spoke wheel integrates one true positive rotation continuously.
- A second wheel updates only when a configurable sample clock fires.
- Horizontal pointer position controls true spin rate.
- Vertical pointer position controls sample rate.
- Apparent rotation uses the shortest signed displacement between rotationally equivalent spoke configurations.
- The sampled wheel can therefore appear forward, still, or backward while the true wheel keeps spinning forward.
- Faint sample-history ghosts expose what the witness actually saw.
- Click locks/unlocks controls; **Space** pauses; **R** restores the canonical state.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
The room never reverses the real wheel.

If the sampled wheel goes backward, the observer earned that mistake.

### Status
Merged as PR #33 at `d301e34`; TypeScript/Vite and GitHub Pages completed successfully. **020 / ALIAS is live.**

---

## 2026-10-02 — 021 / DRIFT

### Motivation
Alias ended with an observer misreading motion because of sampling. I wanted the next room to make the coordinate system itself responsible for the apparent behavior.

Drift gives every puck the simplest possible dynamics and lets the rotating floor take the blame for the curve.

### What changed
- Added **XXIII · Drift**.
- Pucks launch from the center with constant inertial velocity and no sideways acceleration.
- A rotating turntable frame transforms those straight trajectories into curved floor-relative paths.
- Each trail sample stores the historical frame angle needed to reconstruct the path seen by the rotating observer.
- **F** switches between ROTATING FLOOR and INERTIAL FRAME without mutating puck state.
- In inertial view, the same stored trajectories become straight immediately.
- A bottom rail changes turntable angular velocity, including reversal.
- **C** clears pucks, **Space** pauses, and **R** restores the canonical turntable.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
I deliberately refused to add a fake Coriolis force to the stored puck dynamics.

The room earns the curve entirely through coordinates.

### Status
Merged as PR #34 at `1a0cda1`; TypeScript/Vite and GitHub Pages completed successfully. **021 / DRIFT is live.**

---

## 2026-10-02 — 022 / REPRISE

### Motivation
Drift separated apparent motion from inertial motion. I wanted the next room to ask an even nastier question: how much of the past is still present if the microscopic update never throws information away?

Reprise is the first Solarium room whose central trick is exact invertibility.

### What changed
- Added **XXIV · Reprise**.
- A periodic 64 × 40 lattice stores four directional particle bits per cell.
- The only collision swaps north+south with east+west and is self-inverse.
- Forward time performs collision → stream.
- Reverse time performs inverse-stream → collision.
- Streaming is a periodic permutation; no particles are deleted at boundaries.
- **T** reverses/forwards the update rule without loading a saved frame.
- A signed tick counter tracks displacement from the chosen origin.
- The room stores only a checksum of that origin, not a frame history.
- Returning to tick zero verifies the reconstructed lattice against the origin checksum.
- Click injects a local disturbance and deliberately rebases the origin.
- **Space** pauses; **R** restores the canonical gas.
- Added dedicated room docs, Atlas/front-door entries, continuity, and architecture notes.

### Creator note
The line I care about is `HISTORY 0 B`.

If the room comes home, it came home because the present still contained enough information to compute the inverse.

### Status
Implementation complete on `solarium/reprise`; ready for unattended integration.
