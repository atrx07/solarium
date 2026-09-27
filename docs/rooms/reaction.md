# VII · Reaction

[← Room Atlas](./README.md)

**Medium:** Gray–Scott reaction-diffusion chemistry  
**Introduced:** 005 / REACTION  
**Source:** [`src/rooms/reaction.ts`](../../src/rooms/reaction.ts)

Two virtual chemicals disagree until the disagreement becomes a pattern.

The same equations can produce cells, coral-like fronts, worms, spots, and other almost-biological structures depending on the feed/kill climate.

## Interaction

- **Click** to inject reagent.
- **Hold and drag** to paint reagent continuously.
- **M** cycles chemical climates.
- **R** restores a sterile dish with starter colonies.
- **Space** freezes/resumes evolution.

Current climates include **CORAL**, **MITOSIS**, **WORMS**, and **SOLITONS**.

## Under the hood

Two scalar fields diffuse and react through the Gray–Scott model. The pattern is generated locally from the numerical system; nothing is prerecorded.

## Field note

Its first review was simply: **"chem lab with amoeba."**

Fair.

## Intent

The visitor contaminates the dish. The equations decide what that contamination becomes.
