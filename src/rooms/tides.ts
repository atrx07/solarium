export type TidePointer = {
  x: number;
  y: number;
  down: boolean;
  active: boolean;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export class TideField {
  private width = 1;
  private height = 1;
  private cols = 1;
  private rows = 1;
  private cellSize = 6;

  private current = new Float32Array(1);
  private previous = new Float32Array(1);
  private next = new Float32Array(1);

  private readonly buffer = document.createElement("canvas");
  private readonly bufferCtx: CanvasRenderingContext2D;
  private image: ImageData;

  private accumulator = 0;
  private lastRain = 0;
  private activity = 0;

  constructor() {
    const context = this.buffer.getContext("2d");
    if (!context) throw new Error("Tides requires Canvas 2D.");
    this.bufferCtx = context;
    this.image = context.createImageData(1, 1);
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    const targetCells = 38_000;
    this.cellSize = clamp(
      Math.ceil(Math.sqrt((this.width * this.height) / targetCells)),
      4,
      9,
    );

    this.cols = Math.max(24, Math.floor(this.width / this.cellSize));
    this.rows = Math.max(16, Math.floor(this.height / this.cellSize));

    const size = this.cols * this.rows;
    this.current = new Float32Array(size);
    this.previous = new Float32Array(size);
    this.next = new Float32Array(size);

    this.buffer.width = this.cols;
    this.buffer.height = this.rows;
    this.image = this.bufferCtx.createImageData(this.cols, this.rows);

    this.reset();
  }

  reset(): void {
    this.current.fill(0);
    this.previous.fill(0);
    this.next.fill(0);
    this.accumulator = 0;
    this.activity = 0;

    this.disturb(this.width * 0.36, this.height * 0.48, 1.8, 4);
    this.disturb(this.width * 0.64, this.height * 0.52, -1.55, 4);
  }

  disturb(x: number, y: number, strength = 2.5, radius = 4): void {
    const gx = Math.floor((x / this.width) * this.cols);
    const gy = Math.floor((y / this.height) * this.rows);

    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        const px = gx + ox;
        const py = gy + oy;
        if (px <= 1 || px >= this.cols - 2 || py <= 1 || py >= this.rows - 2) {
          continue;
        }

        const distance = Math.hypot(ox, oy);
        if (distance > radius) continue;

        const falloff = 0.5 + 0.5 * Math.cos((distance / radius) * Math.PI);
        this.current[py * this.cols + px] += strength * falloff;
      }
    }
  }

  private step(): void {
    const damping = 0.9935;

    for (let y = 1; y < this.rows - 1; y += 1) {
      const row = y * this.cols;
      for (let x = 1; x < this.cols - 1; x += 1) {
        const index = row + x;
        const neighbors =
          this.current[index - 1] +
          this.current[index + 1] +
          this.current[index - this.cols] +
          this.current[index + this.cols];

        this.next[index] =
          (neighbors * 0.5 - this.previous[index]) * damping;
      }
    }

    const oldPrevious = this.previous;
    this.previous = this.current;
    this.current = this.next;
    this.next = oldPrevious;
    this.next.fill(0);
  }

  private update(dt: number, pointer: TidePointer, now: number): void {
    const fixedStep = 1 / 60;
    this.accumulator += Math.min(dt, 48) / 1000;

    let iterations = 0;
    while (this.accumulator >= fixedStep && iterations < 3) {
      this.step();
      this.accumulator -= fixedStep;
      iterations += 1;
    }

    if (pointer.active && pointer.down && now - this.lastRain > 42) {
      this.disturb(pointer.x, pointer.y, 0.78, 2);
      this.lastRain = now;
    }
  }

  private paintBuffer(): void {
    const pixels = this.image.data;
    let sum = 0;

    for (let i = 0; i < this.current.length; i += 1) {
      const value = clamp(this.current[i], -2.4, 2.4);
      const magnitude = Math.min(Math.abs(value) / 2.4, 1);
      const positive = Math.max(value, 0) / 2.4;
      const negative = Math.max(-value, 0) / 2.4;

      const offset = i * 4;
      pixels[offset] = Math.round(5 + magnitude * 28 + negative * 34);
      pixels[offset + 1] = Math.round(8 + magnitude * 54 + positive * 58);
      pixels[offset + 2] = Math.round(16 + magnitude * 130 + positive * 44);
      pixels[offset + 3] = 255;

      sum += magnitude;
    }

    this.activity = sum / this.current.length;
    this.bufferCtx.putImageData(this.image, 0, 0);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    pointer: TidePointer,
    now: number,
    dt: number,
  ): void {
    this.update(dt, pointer, now);
    this.paintBuffer();

    ctx.fillStyle = "#03050b";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, this.width, this.height);
    ctx.restore();

    const vignette = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.16,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.72,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.44)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    if (pointer.active) {
      const radius = pointer.down ? 74 : 30;
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
        pointer.down ? "rgba(220,238,255,0.13)" : "rgba(210,225,255,0.06)",
      );
      glow.addColorStop(1, "rgba(120,150,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fillText(
      `FIELD / ${Math.round(this.activity * 1000)
        .toString()
        .padStart(3, "0")}`,
      28,
      this.height - 74,
    );
  }
}
