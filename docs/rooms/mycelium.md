# V · Mycelium

[← Room Atlas](./README.md)

**Medium:** branching growth  
**Introduced:** 003 / MYCELIUM  
**Source:** [`src/rooms/mycelium.ts`](../../src/rooms/mycelium.ts)

A colony that grows without waiting for instructions.

Active tips wander, branch, spend energy, and leave a network of faint historical veins behind them.

## Interaction

- Hover nearby to bend growth gently.
- **Hold** to become a stronger nutrient source.
- **Click** to plant another spore/colony.
- **R** clears and regrows the ecosystem.

## Under the hood

Each active tip carries heading, speed, energy, generation depth, and an individual phase. Growth is bounded by caps on active tips and historical segments so the room can keep running without eating the browser.

## Intent

The cursor is not a drawing tool. It is food, light, or weather depending on how the colony happens to meet it.

The network should keep making decisions even when you stop moving.
