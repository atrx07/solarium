import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

const COLS = 64;
const ROWS = 40;
const CELL_COUNT = COLS * ROWS;

const NORTH = 1;
const EAST = 2;
const SOUTH = 4;
const WEST = 8;

const STEP_SECONDS = 1 / 30;
const MAX_STEPS_PER_FRAME = 4;

let field = new Uint8Array(CELL_COUNT);
let scratch = new Uint8Array(CELL_COUNT);
let paused = false;
let timeDirection: 1 | -1 = 1;
let accumulator = 0;
let tick = 0;
let originChecksum = 0;
let returnedFlash = 0;

function indexOf(x: number, y: number): number {
  return y * COLS + x;
}

function wrapX(x: number): number {
  return (x + COLS) % COLS;
}

function wrapY(y: number): number {
  return (y + ROWS) % ROWS;
}

function hash01(x: number, y: number, salt: number): number {
  const n =
    Math.sin((x + 1) * 71.173 + (y + 1) * 19.337 + (salt + 1) * 41.771) *
    43758.5453123;
  return n - Math.floor(n);
}

function popcount(mask: number): number {
  let value = mask;
  let count = 0;

  while (value !== 0) {
    count += value & 1;
    value >>>= 1;
  }

  return count;
}

function checksum(): number {
  let hash = 2166136261;

  for (let index = 0; index < field.length; index += 1) {
    hash ^= field[index];
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function particleCount(): number {
  let total = 0;
  for (const mask of field) total += popcount(mask);
  return total;
}

function collision(mask: number): number {
  if (mask === (NORTH | SOUTH)) return EAST | WEST;
  if (mask === (EAST | WEST)) return NORTH | SOUTH;
  return mask;
}

function seedCanonical(): void {
  field.fill(0);
  scratch.fill(0);

  const sources = [
    { x: 0.28, y: 0.44, radius: 0.22 },
    { x: 0.53, y: 0.58, radius: 0.19 },
    { x: 0.72, y: 0.36, radius: 0.17 },
  ];

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const u = (x + 0.5) / COLS;
      const v = (y + 0.5) / ROWS;
      let envelope = 0;

      for (const source of sources) {
        const dx = u - source.x;
        const dy = v - source.y;
        const distance = Math.hypot(dx, dy);
        envelope = Math.max(
          envelope,
          clamp(1 - distance / source.radius, 0, 1),
        );
      }

      if (envelope <= 0) continue;

      let mask = 0;
      const probability = 0.09 + envelope * 0.21;

      if (hash01(x, y, 1) < probability) mask |= NORTH;
      if (hash01(x, y, 2) < probability) mask |= EAST;
      if (hash01(x, y, 3) < probability) mask |= SOUTH;
      if (hash01(x, y, 4) < probability) mask |= WEST;

      field[indexOf(x, y)] = mask;
    }
  }

  paused = false;
  timeDirection = 1;
  accumulator = 0;
  tick = 0;
  returnedFlash = 0;
  originChecksum = checksum();
}

function collideInto(source: Uint8Array, target: Uint8Array): void {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    target[index] = collision(source[index]);
  }
}

function streamForward(source: Uint8Array, target: Uint8Array): void {
  target.fill(0);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const mask = source[indexOf(x, y)];

      if (mask & NORTH) {
        target[indexOf(x, wrapY(y - 1))] |= NORTH;
      }
      if (mask & EAST) {
        target[indexOf(wrapX(x + 1), y)] |= EAST;
      }
      if (mask & SOUTH) {
        target[indexOf(x, wrapY(y + 1))] |= SOUTH;
      }
      if (mask & WEST) {
        target[indexOf(wrapX(x - 1), y)] |= WEST;
      }
    }
  }
}

function streamBackward(source: Uint8Array, target: Uint8Array): void {
  target.fill(0);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const mask = source[indexOf(x, y)];

      if (mask & NORTH) {
        target[indexOf(x, wrapY(y + 1))] |= NORTH;
      }
      if (mask & EAST) {
        target[indexOf(wrapX(x - 1), y)] |= EAST;
      }
      if (mask & SOUTH) {
        target[indexOf(x, wrapY(y - 1))] |= SOUTH;
      }
      if (mask & WEST) {
        target[indexOf(wrapX(x + 1), y)] |= WEST;
      }
    }
  }
}

function forwardStep(): void {
  collideInto(field, scratch);
  streamForward(scratch, field);
  tick += 1;
}

function reverseStep(): void {
  streamBackward(field, scratch);
  collideInto(scratch, field);
  tick -= 1;
}

function stepOnce(): void {
  if (timeDirection > 0) forwardStep();
  else reverseStep();

  if (tick === 0 && checksum() === originChecksum) {
    returnedFlash = 1;
  }
}

function simulate(dtSeconds: number): void {
  if (paused) return;

  accumulator += Math.min(dtSeconds, 0.08);

  let steps = 0;
  while (
    accumulator >= STEP_SECONDS &&
    steps < MAX_STEPS_PER_FRAME
  ) {
    accumulator -= STEP_SECONDS;
    stepOnce();
    steps += 1;
  }
}

function layoutFor(width: number, height: number): {
  left: number;
  top: number;
  cell: number;
  width: number;
  height: number;
} {
  const mobile = width < 680;
  const availableWidth = width - (mobile ? 28 : Math.max(70, width * 0.11));
  const availableHeight = height - (mobile ? 245 : 205);
  const cell = Math.max(
    2,
    Math.min(availableWidth / COLS, availableHeight / ROWS),
  );
  const fieldWidth = cell * COLS;
  const fieldHeight = cell * ROWS;

  return {
    left: (width - fieldWidth) / 2,
    top: Math.max(mobile ? 112 : 96, (height - fieldHeight) * 0.45),
    cell,
    width: fieldWidth,
    height: fieldHeight,
  };
}

function cellFromPoint(
  width: number,
  height: number,
  px: number,
  py: number,
): { x: number; y: number } | undefined {
  const layout = layoutFor(width, height);
  const x = Math.floor((px - layout.left) / layout.cell);
  const y = Math.floor((py - layout.top) / layout.cell);

  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return undefined;
  return { x, y };
}

function rebaseOrigin(): void {
  tick = 0;
  accumulator = 0;
  returnedFlash = 0;
  originChecksum = checksum();
}

function inject(x: number, y: number): void {
  const points = [
    { dx: 0, dy: -2, bit: NORTH },
    { dx: 0, dy: -1, bit: NORTH },
    { dx: 2, dy: 0, bit: EAST },
    { dx: 1, dy: 0, bit: EAST },
    { dx: 0, dy: 2, bit: SOUTH },
    { dx: 0, dy: 1, bit: SOUTH },
    { dx: -2, dy: 0, bit: WEST },
    { dx: -1, dy: 0, bit: WEST },
  ];

  for (const point of points) {
    const px = wrapX(x + point.dx);
    const py = wrapY(y + point.dy);
    field[indexOf(px, py)] ^= point.bit;
  }

  rebaseOrigin();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  cell: number,
): void {
  const half = cell * 0.5;
  const reach = Math.max(0.7, cell * 0.27);
  const thickness = Math.max(1, cell * 0.12);

  ctx.lineCap = "round";

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const mask = field[indexOf(x, y)];
      if (mask === 0) continue;

      const cx = left + (x + 0.5) * cell;
      const cy = top + (y + 0.5) * cell;

      ctx.lineWidth = thickness;

      if (mask & NORTH) {
        ctx.strokeStyle = "rgba(178,218,255,0.62)";
        ctx.beginPath();
        ctx.moveTo(cx, cy - half * 0.08);
        ctx.lineTo(cx, cy - reach);
        ctx.stroke();
      }

      if (mask & EAST) {
        ctx.strokeStyle = "rgba(255,217,171,0.6)";
        ctx.beginPath();
        ctx.moveTo(cx + half * 0.08, cy);
        ctx.lineTo(cx + reach, cy);
        ctx.stroke();
      }

      if (mask & SOUTH) {
        ctx.strokeStyle = "rgba(151,198,255,0.46)";
        ctx.beginPath();
        ctx.moveTo(cx, cy + half * 0.08);
        ctx.lineTo(cx, cy + reach);
        ctx.stroke();
      }

      if (mask & WEST) {
        ctx.strokeStyle = "rgba(255,188,144,0.44)";
        ctx.beginPath();
        ctx.moveTo(cx - half * 0.08, cy);
        ctx.lineTo(cx - reach, cy);
        ctx.stroke();
      }
    }
  }
}

if (originChecksum === 0) seedCanonical();

export const repriseRoom: RoomModule = {
  id: "reprise",
  title: "XXIV · Reprise",
  copy: "Reverse the rule. The present reconstructs its own past.",
  hint:
    "T reverses time · click injects and chooses a new origin · Space pause · R restore",

  enter({ setStatus }): void {
    setStatus("reprise / forward · no history stored");
  },

  draw({ stage }, dt): void {
    simulate(Math.min(dt, 32) / 1000);
    returnedFlash *= Math.exp(-Math.min(dt, 32) / 280);

    const { ctx, width, height } = stage;
    const layout = layoutFor(width, height);

    stage.clear("#03050a");
    stage.drawStars(0.02);

    ctx.strokeStyle = returnedFlash > 0.03
      ? `rgba(255,231,188,${(0.2 + returnedFlash * 0.4).toFixed(3)})`
      : "rgba(218,231,255,0.09)";
    ctx.lineWidth = returnedFlash > 0.03 ? 1.5 : 1;
    ctx.strokeRect(
      layout.left - 1,
      layout.top - 1,
      layout.width + 2,
      layout.height + 2,
    );

    drawParticles(ctx, layout.left, layout.top, layout.cell);

    if (stage.pointer.active) {
      const cell = cellFromPoint(
        width,
        height,
        stage.pointer.x,
        stage.pointer.y,
      );

      if (cell) {
        ctx.strokeStyle = "rgba(255,241,215,0.22)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          layout.left + cell.x * layout.cell,
          layout.top + cell.y * layout.cell,
          layout.cell,
          layout.cell,
        );
      }
    }

    const count = particleCount();
    const recovered = tick === 0 && checksum() === originChecksum;
    const messageY = Math.min(
      height - 86,
      layout.top + layout.height + 56,
    );

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = recovered && returnedFlash > 0.03
      ? "rgba(255,232,193,0.9)"
      : timeDirection < 0
        ? "rgba(255,215,176,0.72)"
        : "rgba(214,232,255,0.58)";
    ctx.fillText(
      recovered && returnedFlash > 0.03
        ? "Origin recovered exactly. No recording was replayed."
        : timeDirection > 0
          ? "Collide. Stream. Forget the past."
          : "Inverse-stream. Uncollide. Reconstruct it.",
      width / 2,
      messageY,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.25)";
    ctx.fillText(
      `${timeDirection > 0 ? "FORWARD" : "REVERSE"} · TICK ${tick >= 0 ? "+" : ""}${tick} · PARTICLES ${count} · HISTORY 0 B${paused ? " · PAUSED" : ""}`,
      width / 2,
      messageY + 24,
    );
  },

  click({ stage, setStatus }, x, y): void {
    const cell = cellFromPoint(stage.width, stage.height, x, y);

    if (!cell) {
      setStatus("reprise / inject inside the lattice");
      return;
    }

    inject(cell.x, cell.y);
    setStatus("reprise / disturbance injected · new origin");
  },

  key(env, event): void {
    const key = event.key.toLowerCase();

    if (key === "t") {
      timeDirection = timeDirection > 0 ? -1 : 1;
      accumulator = 0;
      env.setStatus(
        timeDirection > 0
          ? "reprise / forward"
          : "reprise / reverse · no history stored",
      );
      return;
    }

    if (key === "r") {
      seedCanonical();
      env.setStatus("reprise / canonical gas restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "reprise / paused" : "reprise / running");
    }
  },
};
