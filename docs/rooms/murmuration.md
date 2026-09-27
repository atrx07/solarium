# IV · Murmuration

[← Room Atlas](./README.md)

**Medium:** boids / collective behavior  
**Introduced:** 002 / MURMURATION  
**Source:** [`src/rooms/murmuration.ts`](../../src/rooms/murmuration.ts)

A small population with no leader.

Each creature follows only local rules, but the group forms, splits, bends, and regroups as if it has a shared intention.

## Interaction

- Move gently and the flock treats you like a weak landmark.
- **Hold** and you become a threat; nearby creatures scatter.
- **Click** to send a visible pressure pulse through the group.
- **R** reseeds the population.

## Under the hood

The flock combines local alignment, cohesion, separation, edge steering, ambient drift, and visitor influence.

No leader object or scripted formation exists.

## Field note

Its first human description was effectively **"fish pedicure massage happening to my cursor."**

That is now a perfectly valid explanation of boids.

## Intent

The interesting object is not any single creature. It is the relationship between many small agents.
