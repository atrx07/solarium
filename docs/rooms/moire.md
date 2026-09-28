# XI · Moiré

[← Room Atlas](./README.md)

**Medium:** geometric optical interference  
**Introduced:** 009 / MOIRÉ  
**Source:** [`src/rooms/moire.ts`](../../src/rooms/moire.ts)

Two families of perfectly straight, closely spaced lines cross at slightly different angles and distances. From that disagreement, the eye invents moving curves, bands, and breathing structures that no line ever draws.

## Interaction

- Move the pointer: change the disagreement in rotation and spacing.
- Click or press Enter with the keyboard cursor: cycle VEIL, RIBBON, DRIFT, TREMOR, and HALO geometries.
- **Space:** freeze/resume the pattern (including pointer influence).
- **R:** restore the initial geometry.
- **Esc:** return to the Atrium.

## Under the hood

The room clips two bounded batches of straight Canvas 2D line segments to an elliptical chamber. Each batch has its own pitch, rotation, and slow phase. A small discrepancy produces the perceived moiré patterns. The geometry is calculated locally with no images, external assets, dependencies, or remote services.

Line count is capped so even denser presets remain bounded. Reduced-motion pacing comes from Solarium's shared frame controller.

## Field note

The original scheduled attempt created the correct branch but got blocked before its first TypeScript file write by a connector safety gate. The room was recovered interactively on **the same branch**, not re-created elsewhere.

## Intent

An optical illusion with the simplest possible ingredients: two sets of lines and a visitor who can make them disagree.
