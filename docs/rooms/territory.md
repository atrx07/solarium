# XIV · Territory

[← Room Atlas](./README.md)

**Medium:** Voronoi partition / proximity geometry  
**Introduced:** 012 / TERRITORY  
**Source:** [`src/rooms/territory.ts`](../../src/rooms/territory.ts)

No border is authored directly.

A set of drifting seeds simply ask one question of every point in the chamber: **which seed is closest?** The answer partitions the room into territories automatically.

## Interaction

- Move the pointer through the room to become a temporary ghost seed. Nearby territory is reassigned to you immediately.
- Click empty space to plant a permanent seed.
- Click near an existing seed to remove it.
- **Space** pauses/resumes seed drift.
- **R** restores the canonical twelve-seed arrangement.
- **Esc** returns to the Atrium.

## Under the hood

The room uses a bounded sampled Voronoi-style partition. For each visual sample point, it finds the nearest permanent seed; while the pointer is active, the pointer competes as one additional temporary site.

A second coarser pass compares neighboring sample ownership and draws understated boundary fragments where ownership changes. The borders therefore emerge from nearest-neighbor disagreement rather than being stored as geometry.

Permanent seeds drift slowly in normalized coordinates and reflect from soft room bounds. Site count is capped at twenty-four and sampling density is fixed, keeping work predictable across browsers.

## Intent

Territory is not about nations, rules, conquest, or politics. It is about the mathematical fact that **proximity alone can create borders**.

The visitor gets to feel that rule by becoming a region without ever drawing a wall.
