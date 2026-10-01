import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

type Cell = {
  value: number;
  connected: boolean;
};

const COLS = 44;
const ROWS = 30;

let cells: Cell[] = [];
let seedOffset = 0;
let lockedThreshold: number | null = null;

function hash01(x: number, y: number, seed: number): number {
  const n =
    Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 37.719) *
    43758.5453123;
  return n - Math.floor(n);
}

function reseed(offset = 0): void {
  seedOffset = offset;
  cells = Array.from({ length: COLS * ROWS }, (_, index) => {
    const x = index % COLS;
    const y = Math.floor(index / COLS);
    return {
      value: hash01(x, y, seedOffset),
      connected: false,
    };
  });
  lockedThreshold = null;
}

function indexOf(x: number, y: number): number {
  return y * COLS + x;
}

function solve(threshold: number): boolean {
  for (const cell of cells) cell.connected = false;

  const queue: Array<[number, number]> = [];
  let head = 0;

  for (let x = 0; x < COLS; x += 1) {
    const cell = cells[indexOf(x, 0)];
    if (cell.value <= threshold) {
      cell.connected = true;
      queue.push([x, 0]);
    }
  }

  let spans = false;

  while (head < queue.length) {
    const [x, y] = queue[head];
    head += 1;

    if (y === ROWS - 1) spans = true;

    const neighbors: Array<[number, number]> = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const cell = cells[indexOf(nx, ny)];
      if (cell.connected || cell.value > threshold) continue;

      cell.connected = true;
      queue.push([nx, ny]);
    }
  }

  return spans;
}

function currentThreshold(width: number, pointerX: number, pointerActive: boolean): number {
  if (lockedThreshold !== null) return lockedThreshold;
  if (!pointerActive) return 0.57;

  const u = clamp(pointerX / Math.max(width, 1), 0, 1);
  return 0.28 + u * 0.46;
}

if (cells.length === 0) reseed();

export const thresholdRoom: RoomModule = {
  id: "threshold",
  title: "XV · Threshold",
  copy: "Nothing connects. Then one tiny change makes a path across everything.",
  hint:
    "move left/right to change threshold · click reseeds · Space locks threshold · R restores",

  enter({ setStatus }): void {
    setStatus("threshold / below and above");
  },

  draw({ stage }): void {
    const { ctx, width, height } = stage;
    const threshold = currentThreshold(
      width,
      stage.pointer.x,
      stage.pointer.active,
    );
    const spans = solve(threshold);

    stage.clear("#03050a");
    stage.drawStars(0.05);

    const marginX = Math.max(24, width * 0.055);
    const marginTop = Math.max(70, height * 0.12);
    const marginBottom = Math.max(92, height * 0.15);
    const fieldWidth = width - marginX * 2;
    const fieldHeight = height - marginTop - marginBottom;
    const cellW = fieldWidth / COLS;
    const cellH = fieldHeight / ROWS;
    const gap = Math.min(cellW, cellH) * 0.14;

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = cells[indexOf(x, y)];
        const active = cell.value <= threshold;

        const px = marginX + x * cellW;
        const py = marginTop + y * cellH;

        if (!active) {
          ctx.fillStyle = "rgba(205,220,255,0.035)";
        } else if (cell.connected) {
          ctx.fillStyle = spans
            ? "rgba(255,232,168,0.72)"
            : "rgba(177,211,255,0.48)";
        } else {
          ctx.fillStyle = "rgba(135,157,205,0.18)";
        }

        ctx.fillRect(
          px + gap,
          py + gap,
          Math.max(1, cellW - gap * 2),
          Math.max(1, cellH - gap * 2),
        );
      }
    }

    ctx.save();
    ctx.strokeStyle = spans
      ? "rgba(255,229,155,0.52)"
      : "rgba(199,218,255,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(marginX, marginTop, fieldWidth, fieldHeight);
    ctx.restore();

    const markerX = marginX + clamp(
      (threshold - 0.28) / 0.46,
      0,
      1,
    ) * fieldWidth;

    ctx.strokeStyle = spans
      ? "rgba(255,235,176,0.55)"
      : "rgba(210,225,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(markerX, marginTop - 16);
    ctx.lineTo(markerX, marginTop - 4);
    ctx.stroke();

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(232,240,255,0.48)";
    ctx.fillText(
      `THRESHOLD ${threshold.toFixed(3)} / ${spans ? "SPANNING PATH" : "ISLANDS"}${lockedThreshold !== null ? " / LOCKED" : ""}`,
      marginX,
      height - 64,
    );

    ctx.fillStyle = spans
      ? "rgba(255,239,190,0.82)"
      : "rgba(232,240,255,0.34)";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(
      spans
        ? "The chamber just became one connected event."
        : "Tiny local openings. No complete crossing yet.",
      marginX,
      height - 36,
    );
  },

  click({ setStatus }): void {
    reseed(seedOffset + 1);
    setStatus("threshold / latent field reseeded");
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reseed(0);
      env.setStatus("threshold / canonical field restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      if (lockedThreshold === null) {
        lockedThreshold = currentThreshold(
          env.stage.width,
          env.stage.pointer.x,
          env.stage.pointer.active,
        );
        env.setStatus("threshold / value locked");
      } else {
        lockedThreshold = null;
        env.setStatus("threshold / pointer control restored");
      }
    }
  },
};
