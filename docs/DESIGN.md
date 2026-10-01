# Design Direction

Solarium should feel like a place that happens to be made of software, not software wearing a museum costume.

This document keeps a small amount of visual continuity in the repository. It is intentionally lighter than a conventional design system.

## Core rule

**The experiment is more important than the interface around it.**

A room may be strange, sparse, dense, mathematical, sonic, or difficult to explain. The surrounding UI should help the visitor enter that experience without becoming the experience itself.

## Anti-generic habits

Avoid recurring AI-generated interface defaults:

- narrow display headings that wrap into tall text walls,
- piles of interchangeable cards, pills, badges, stats, or glass panels,
- fake editorial labels such as `SECTION 01`, `DISCOVER`, or `EXPERIENCE 04`,
- repeating left-copy/right-visual layouts merely because they are easy,
- decorative controls with weak or unclear purpose,
- motion added only to signal that something is "premium",
- marketing-page structures imposed on spaces that are not products.

Prefer one strong composition, useful negative space, wide readable typography, direct manipulation, and controls that belong to the room's actual idea.

## Typography

Display text should generally stay wide enough to resolve in one to three lines.

Use scale, weight, opacity, spacing, and position before introducing extra colors or ornamental labels.

Monospace remains part of Solarium's language for instrumentation, controls, and small system text. It is not required for every sentence.

No external font service is required.

## Motion

Motion should reveal state, causality, behavior, hierarchy, or atmosphere.

Use the existing browser-native Canvas/CSS/Web Audio stack where possible. Do not add GSAP, React, animation frameworks, or another runtime dependency merely for visual prestige.

Respect the shared reduced-motion contract documented in `ARCHITECTURE.md`.

## Controls

Every visible control should survive this question:

> What meaningful thing does this let the visitor do?

If the answer is merely decorative, redesign or remove it.

Prefer direct manipulation to menus. A mode switch is useful when it reveals a genuinely different view of the same system, as Polarity's FIELD/POTENTIAL lens does.

## External design tools

External tools such as MagicPath or Figma may be used as **development sketchbooks** for composition studies.

They are not production dependencies. Solarium's shipped experience must continue to work from the repository alone, locally, without accounts, remote assets, paid services, or metered APIs.

## Atrium precedent

The 2026-09-30 Atrium arrival study established a useful pattern:

- treat the `SOLARIUM` wordmark as environmental architecture rather than a conventional logo block,
- let the central light and orbit system remain the visual subject,
- keep arrival metadata tiny and peripheral,
- move explanatory copy low and wide instead of presenting it as a dashboard panel,
- remove that arrival treatment after entering a room so room interfaces remain subordinate to their experiments.

This is a precedent, not a mandatory template for future rooms.

## Mobile composition

Mobile is a separate composition problem, not a smaller desktop. Preserve breathing room, touch-first instruction density, and the hierarchy of the room even when that requires different orbital spacing, copy placement, or hidden instrumentation.
