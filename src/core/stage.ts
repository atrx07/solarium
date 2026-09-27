export type Point = {
  x: number;
  y: number;
};

export type PointerState = Point & {
  down: boolean;
  active: boolean;
};

type Star = Point & {
  z: number;
  twinkle: number;
  size: number;
};

export const TAU = Math.PI * 2;

export function rand(min = 0, max = 1): number {
  return min + Math.random() * (max - min);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class Stage {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  width = 0;
  height = 0;
  dpr = 1;
  time = 0;
  readonly pointer: PointerState = { x: 0, y: 0, down: false, active: false };

  private stars: Star[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D is unavailable.");
    this.ctx = context;
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.stars.length === 0) {
      this.stars = Array.from(
        { length: Math.min(420, Math.floor((this.width * this.height) / 4200)) },
        () => ({
          x: rand(0, this.width),
          y: rand(0, this.height),
          z: rand(0.15, 1),
          twinkle: rand(0, TAU),
          size: rand(0.3, 1.5),
        }),
      );
    } else {
      for (const star of this.stars) {
        star.x = clamp(star.x, 0, this.width);
        star.y = clamp(star.y, 0, this.height);
      }
    }
  }

  clear(color = "#050509"): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars(intensity = 1): void {
    const px = this.pointer.active ? (this.pointer.x - this.width / 2) / this.width : 0;
    const py = this.pointer.active ? (this.pointer.y - this.height / 2) / this.height : 0;

    for (const star of this.stars) {
      const shimmer = 0.42 + Math.sin(this.time * 0.0013 + star.twinkle) * 0.22;
      const x = star.x - px * 24 * star.z;
      const y = star.y - py * 24 * star.z;
      this.ctx.globalAlpha = clamp(shimmer * star.z * intensity, 0.06, 0.9);
      this.ctx.fillStyle = "#f8f7ff";
      this.ctx.beginPath();
      this.ctx.arc(x, y, star.size * star.z, 0, TAU);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  glow(x: number, y: number, radius: number, core: string, edge: string): void {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, core);
    gradient.addColorStop(0.18, core);
    gradient.addColorStop(1, edge);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, TAU);
    this.ctx.fill();
  }

  pointFromEvent(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
