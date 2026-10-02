import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

const COLS = 54;
const ROWS = 36;
const CELL_COUNT = COLS * ROWS;
const TOPPLE_HEIGHT = 4;

let grains = new Uint8Array(CELL_COUNT);
let flash = new Float32Array(CELL_COUNT);
let queued = new Uint8Array(CELL_COUNT);
let queue: number[] = [];
let queueHead = 0;
let paused = false;
let lastRainAt = 0;
let currentTopplings = 0;
let lastAvalanche = 0;
let largestAvalanche = 0;
let dissipated = 0;

function hash01(x: number, y: number, salt = 0): number {
  const n =
    Math.sin((x + 1) * 71.173 + (y + 1) * 19.337 + (salt + 1) * 43.117) *
    43758.5453123;
  return n - Math.floor(n);
}

function indexOf(x: number, y: number): number {
  return y * COLS + x;
}

function hasPendingTopplings(): boolean {
  return queueHead < queue.length;
}

function enqueue(index: number): void {
  if (grains[index] < TOPPLE_HEIGHT || queued[index]) return;
  queued[index] = 1;
  queue.push(index);
}

function reset(): void {
  queue = [];
  queueHead = 0;
  queued.fill(0);
  flash.fill(0);
  paused = false;
  lastRainAt = 0;
  currentTopplings = 0;
  lastAvalanche = 0;
  largestAvalanche = 0;
  dissipated = 0;

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const r = hash01(x, y);
      // Start close to critical without beginning unstable. The field is
      // deterministic so the same first grain always has the same history.
      grains[indexOf(x, y)] = r < 0.08 ? 1 : r < 0.46 ? 2 : 3;
    }
  }
}

function addGrain(index: number): void {
  if (!hasPendingTopplings()) currentTopplings = 0;

  grains[index] = Math.min(250, grains[index] + 1);
  flash[index] = Math.max(flash[index], 0.24);
  enqueue(index);
}

function addAtNormalized(nx: number, ny: number): void {
  const x = Math.floor(clamp(nx, 0, 0.9999) * COLS);
  const y = Math.floor(clamp(ny, 0, 0.9999) * ROWS);
  addGrain(indexOf(x, y));
}

function giveGrain(x: number, y: number): void {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
    dissipated += 1;
    return;
  }

  const index = indexOf(x, y);
  grains[index] = Math.min(250, grains[index] + 1);
  flash[index] = Math.max(flash[index], 0.18);
  enqueue(index);
}

function finishAvalancheIfStable(): void {
  if (hasPendingTopplings() || currentTopplings <= 0) return;

  lastAvalanche = currentTopplings;
  largestAvalanche = Math.max(largestAvalanche, currentTopplings);
  currentTopplings = 0;
  queue = [];
  queueHead = 0;
  queued.fill(0);
}

function processTopplings(budget: number): void {
  let steps = 0;

  while (steps < budget && hasPendingTopplings()) {
    const index = queue[queueHead];
    queueHead += 1;
    queued[index] = 0;

    if (grains[index] < TOPPLE_HEIGHT) continue;

    grains[index] -= TOPPLE_HEIGHT;
    flash[index] = 1;
    currentTopplings += 1;
    steps += 1;

    const x = index % COLS;
    const y = Math.floor(index / COLS);

    giveGrain(x - 1, y);
    giveGrain(x + 1, y);
    giveGrain(x, y - 1);
    giveGrain(x, y + 1);

    enqueue(index);
  }

  if (queueHead > 1200 && queueHead < queue.length) {
    queue = queue.slice(queueHead);
    queueHead = 0;
  }

  finishAvalancheIfStable();
}

function fieldLayout(width: number, height: number): {
  left: number;
  top: number;
  cell: number;
  width: number;
  height: number;
} {
  const mobile = width < 680;
  const marginX = mobile ? 18 : Math.max(42, width * 0.065);
  const availableWidth = width - marginX * 2;
  const availableHeight = height - (mobile ? 250 : 205);
  const cell = Math.max(
    2,
    Math.min(availableWidth / COLS, availableHeight / ROWS),
  );
  const fieldWidth = cell * COLS;
  const fieldHeight = cell * ROWS;
  const left = (width - fieldWidth) / 2;
  const top = Math.max(
    mobile ? 118 : 104,
    (height - fieldHeight) * 0.46,
  );

  return {
    left,
    top,
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
): number | undefined {
  const layout = fieldLayout(width, height);
  const x = Math.floor((px - layout.left) / layout.cell);
  const y = Math.floor((py - layout.top) / layout.cell);

  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return undefined;
  return indexOf(x, y);
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  value: number,
  heat: number,
): void {
  const inset = Math.max(0.55, cellSize * 0.075);
  const alpha =
    value === 0
      ? 0.025
      : value === 1
        ? 0.08
        : value === 2
          ? 0.16
          : 0.31;

  if (heat > 0.02) {
    ctx.fillStyle = `rgba(255,225,178,${Math.min(0.72, heat * 0.6).toFixed(3)})`;
  } else if (value >= 3) {
    ctx.fillStyle = `rgba(255,214,157,${alpha})`;
  } else {
    ctx.fillStyle = `rgba(183,211,255,${alpha})`;
  }

  ctx.fillRect(
    x + inset,
    y + inset,
    Math.max(1, cellSize - inset * 2),
    Math.max(1, cellSize - inset * 2),
  );
}

if (grains.length === CELL_COUNT) reset();

export const avalancheRoom: RoomModule = {
  id: "avalanche",
  title: "XIX · Avalanche",
  copy: "One grain can be nothing. The next can wake the whole floor.",
  hint: "click to add one grain · hold to rain slowly · Space pause · R restore",

  enter({ setStatus }): void {
    setStatus("avalanche / one local rule");
  },

  draw({ stage }, dt): void {
    const { ctx, width, height } = stage;
    const layout = fieldLayout(width, height);

    if (
      stage.pointer.down &&
      !paused &&
      stage.time - lastRainAt >= 82
    ) {
      const index = cellFromPoint(
        width,
        height,
        stage.pointer.x,
        stage.pointer.y,
      );
      if (index !== undefined) {
        addGrain(index);
        lastRainAt = stage.time;
      }
    }

    if (!paused) {
      processTopplings(width < 680 ? 52 : 92);
    }

    const fade = Math.exp(-Math.min(dt, 32) / 170);
    for (let index = 0; index < flash.length; index += 1) {
      flash[index] *= fade;
    }

    stage.clear("#03050a");
    stage.drawStars(0.025);

    ctx.save();
    ctx.strokeStyle = "rgba(214,226,255,0.09)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      layout.left - 1,
      layout.top - 1,
      layout.width + 2,
      layout.height + 2,
    );

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const index = indexOf(x, y);
        drawCell(
          ctx,
          layout.left + x * layout.cell,
          layout.top + y * layout.cell,
          layout.cell,
          grains[index],
          flash[index],
        );
      }
    }

    const hovered =
      stage.pointer.active
        ? cellFromPoint(
            width,
            height,
            stage.pointer.x,
            stage.pointer.y,
          )
        : undefined;

    if (hovered !== undefined) {
      const hx = hovered % COLS;
      const hy = Math.floor(hovered / COLS);
      ctx.strokeStyle = "rgba(255,244,220,0.42)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        layout.left + hx * layout.cell + 0.5,
        layout.top + hy * layout.cell + 0.5,
        Math.max(1, layout.cell - 1),
        Math.max(1, layout.cell - 1),
      );
    }

    ctx.restore();

    const active = hasPendingTopplings();
    const displayTopplings = active ? currentTopplings : lastAvalanche;
    const centerX = width / 2;
    const textY = Math.min(height - 72, layout.top + layout.height + 70);

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = active
      ? "rgba(255,226,182,0.82)"
      : "rgba(232,240,255,0.46)";

    ctx.fillText(
      active
        ? "The floor is still answering that grain."
        : lastAvalanche > 700
          ? "One grain found a very long way through."
          : lastAvalanche > 0
            ? "Quiet again. Add another."
            : "Stable does not mean inactive.",
      centerX,
      textY,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.24)";
    ctx.fillText(
      `${active ? "TOPPLING" : "LAST"} ${displayTopplings} · PEAK ${largestAvalanche} · LOST ${dissipated}${paused ? " · PAUSED" : ""}`,
      centerX,
      textY + 24,
    );
  },

  click({ stage, setStatus }, x, y): void {
    const index = cellFromPoint(stage.width, stage.height, x, y);

    if (index === undefined) {
      setStatus("avalanche / add grains inside the chamber");
      return;
    }

    addGrain(index);
    setStatus(
      hasPendingTopplings()
        ? "avalanche / unstable"
        : "avalanche / one grain added",
    );
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("avalanche / canonical pile restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "avalanche / paused" : "avalanche / released");
    }
  },
};
