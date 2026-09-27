import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

type Climate = {
  name: string;
  feed: number;
  kill: number;
};

const climates: Climate[] = [
  { name: "CORAL", feed: 0.0545, kill: 0.062 },
  { name: "MITOSIS", feed: 0.0367, kill: 0.0649 },
  { name: "WORMS", feed: 0.078, kill: 0.061 },
  { name: "SOLITONS", feed: 0.03, kill: 0.062 },
];

class ReactionField {
  private width = 1;
  private height = 1;
  private cols = 1;
  private rows = 1;
  private cellSize = 6;

  private a = new Float32Array(1);
  private b = new Float32Array(1);
  private nextA = new Float32Array(1);
  private nextB = new Float32Array(1);

  private readonly buffer = document.createElement("canvas");
  private readonly bufferCtx: CanvasRenderingContext2D;
  private image: ImageData;

  private climateIndex = 0;
  private paused = false;
  private lastPaint = 0;
  private activity = 0;

  constructor() {
    const context = this.buffer.getContext("2d");
    if (!context) throw new Error("Reaction requires Canvas 2D.");
    this.bufferCtx = context;
    this.image = context.createImageData(1, 1);
  }

  get climate(): Climate {
    return climates[this.climateIndex];
  }

  get isPaused(): boolean {
    return this.paused;
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    const targetCells = 34_000;
    this.cellSize = clamp(
      Math.ceil(Math.sqrt((this.width * this.height) / targetCells)),
      4,
      9,
    );

    this.cols = Math.max(36, Math.floor(this.width / this.cellSize));
    this.rows = Math.max(24, Math.floor(this.height / this.cellSize));

    const size = this.cols * this.rows;
    this.a = new Float32Array(size);
    this.b = new Float32Array(size);
    this.nextA = new Float32Array(size);
    this.nextB = new Float32Array(size);

    this.buffer.width = this.cols;
    this.buffer.height = this.rows;
    this.image = this.bufferCtx.createImageData(this.cols, this.rows);

    this.reset();
  }

  reset(): void {
    this.a.fill(1);
    this.b.fill(0);
    this.nextA.fill(1);
    this.nextB.fill(0);
    this.activity = 0;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const spread = Math.min(this.width, this.height) * 0.16;

    this.inject(cx, cy, 9);
    this.inject(cx - spread, cy + spread * 0.35, 6);
    this.inject(cx + spread * 0.9, cy - spread * 0.5, 6);
  }

  cycleClimate(): void {
    this.climateIndex = (this.climateIndex + 1) % climates.length;
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  inject(x: number, y: number, radius = 6): void {
    const gx = Math.floor((x / this.width) * this.cols);
    const gy = Math.floor((y / this.height) * this.rows);

    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        const px = gx + ox;
        const py = gy + oy;
        if (px < 1 || px >= this.cols - 1 || py < 1 || py >= this.rows - 1) {
          continue;
        }

        const distance = Math.hypot(ox, oy);
        if (distance > radius) continue;

        const falloff = 0.5 + 0.5 * Math.cos((distance / radius) * Math.PI);
        const index = py * this.cols + px;
        this.b[index] = Math.max(this.b[index], 0.72 + falloff * 0.28);
        this.a[index] = Math.min(this.a[index], 0.38 - falloff * 0.16);
      }
    }
  }

  private laplacian(field: Float32Array, index: number): number {
    const c = this.cols;

    return (
      field[index] * -1 +
      field[index - 1] * 0.2 +
      field[index + 1] * 0.2 +
      field[index - c] * 0.2 +
      field[index + c] * 0.2 +
      field[index - c - 1] * 0.05 +
      field[index - c + 1] * 0.05 +
      field[index + c - 1] * 0.05 +
      field[index + c + 1] * 0.05
    );
  }

  private step(): void {
    const { feed, kill } = this.climate;
    const diffuseA = 1;
    const diffuseB = 0.5;

    for (let y = 1; y < this.rows - 1; y += 1) {
      const row = y * this.cols;
      for (let x = 1; x < this.cols - 1; x += 1) {
        const index = row + x;
        const a = this.a[index];
        const b = this.b[index];
        const reaction = a * b * b;

        const nextA =
          a +
          diffuseA * this.laplacian(this.a, index) -
          reaction +
          feed * (1 - a);

        const nextB =
          b +
          diffuseB * this.laplacian(this.b, index) +
          reaction -
          (kill + feed) * b;

        this.nextA[index] = clamp(nextA, 0, 1);
        this.nextB[index] = clamp(nextB, 0, 1);
      }
    }

    for (let x = 0; x < this.cols; x += 1) {
      const top = x;
      const bottom = (this.rows - 1) * this.cols + x;
      this.nextA[top] = 1;
      this.nextB[top] = 0;
      this.nextA[bottom] = 1;
      this.nextB[bottom] = 0;
    }

    for (let y = 0; y < this.rows; y += 1) {
      const left = y * this.cols;
      const right = left + this.cols - 1;
      this.nextA[left] = 1;
      this.nextB[left] = 0;
      this.nextA[right] = 1;
      this.nextB[right] = 0;
    }

    [this.a, this.nextA] = [this.nextA, this.a];
    [this.b, this.nextB] = [this.nextB, this.b];
  }

  private update(pointerDown: boolean, pointerX: number, pointerY: number, now: number): void {
    if (pointerDown && now - this.lastPaint > 38) {
      this.inject(pointerX, pointerY, 4);
      this.lastPaint = now;
    }

    if (this.paused) return;

    for (let i = 0; i < 5; i += 1) {
      this.step();
    }
  }

  private paintBuffer(): void {
    const pixels = this.image.data;
    let active = 0;

    for (let i = 0; i < this.a.length; i += 1) {
      const a = this.a[i];
      const b = this.b[i];
      const edge = clamp(Math.abs(a - b) * 1.8, 0, 1);
      const reagent = clamp(b * 1.45, 0, 1);
      const voidness = clamp(1 - a, 0, 1);

      const offset = i * 4;
      pixels[offset] = Math.round(4 + reagent * 92 + edge * 38);
      pixels[offset + 1] = Math.round(5 + edge * 122 + voidness * 32);
      pixels[offset + 2] = Math.round(12 + reagent * 154 + edge * 78);
      pixels[offset + 3] = 255;

      active += reagent;
    }

    this.activity = active / this.a.length;
    this.bufferCtx.putImageData(this.image, 0, 0);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    pointer: { x: number; y: number; down: boolean; active: boolean },
    now: number,
  ): void {
    this.update(pointer.down, pointer.x, pointer.y, now);
    this.paintBuffer();

    ctx.fillStyle = "#03040a";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, this.width, this.height);
    ctx.restore();

    const vignette = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.18,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.7,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    if (pointer.active) {
      const radius = pointer.down ? 72 : 26;
      const glow = ctx.createRadialGradient(
        pointer.x,
        pointer.y,
        0,
        pointer.x,
        pointer.y,
        radius,
      );
      glow.addColorStop(
        0,
        pointer.down ? "rgba(225,214,255,0.15)" : "rgba(220,225,255,0.05)",
      );
      glow.addColorStop(1, "rgba(125,130,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillText(
      `${this.climate.name} / ${Math.round(this.activity * 1000)
        .toString()
        .padStart(3, "0")}${this.paused ? " / PAUSED" : ""}`,
      28,
      this.height - 74,
    );
  }
}

const field = new ReactionField();

export const reactionRoom: RoomModule = {
  id: "reaction",
  title: "VII · Reaction",
  copy: "Two chemicals disagree until the disagreement becomes a pattern.",
  hint: "click seeds reagent · hold paints · M changes climate · R sterilizes · space freezes",

  resize({ stage }): void {
    field.resize(stage.width, stage.height);
  },

  draw({ stage }): void {
    field.draw(stage.ctx, stage.pointer, stage.time);
  },

  click(_env, x, y): void {
    field.inject(x, y, 7);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      field.reset();
      env.setStatus("reaction / sterile");
      return;
    }

    if (event.key.toLowerCase() === "m") {
      field.cycleClimate();
      env.setStatus(`climate / ${field.climate.name.toLowerCase()}`);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      field.togglePause();
      env.setStatus(field.isPaused ? "reaction / frozen" : "reaction / awake");
    }
  },
};
