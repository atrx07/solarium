import type { RoomModule } from "../core/room";
import { TAU, clamp, dist } from "../core/stage";

type Car = {
  s: number;
  speed: number;
  desiredSpeed: number;
  brake: number;
};

type TrackPoint = {
  x: number;
  y: number;
  angle: number;
};

const CAR_COUNT = 58;
const CAR_LENGTH = 0.0068;
const MIN_GAP = 0.0042;
const TARGET_HEADWAY = 0.12;
const ACCEL = 0.028;
const BRAKE = 0.09;
const MAX_SPEED = 0.058;

let cars: Car[] = [];
let paused = false;
let seed = 0;

function hash01(index: number, salt: number): number {
  const n = Math.sin((index + 1) * 17.731 + (salt + 1) * 91.173) * 43758.5453;
  return n - Math.floor(n);
}

function reset(nextSeed = 0): void {
  seed = nextSeed;
  paused = false;
  cars = Array.from({ length: CAR_COUNT }, (_, index) => {
    const base = index / CAR_COUNT;
    const jitter = (hash01(index, seed) - 0.5) * 0.0013;
    const desired = 0.049 + (hash01(index, seed + 7) - 0.5) * 0.006;

    return {
      s: (base + jitter + 1) % 1,
      speed: desired * (0.96 + hash01(index, seed + 13) * 0.05),
      desiredSpeed: desired,
      brake: 0,
    };
  });

  cars.sort((a, b) => a.s - b.s);
}

function trackPoint(width: number, height: number, s: number): TrackPoint {
  const cx = width / 2;
  const cy = height * (width < 680 ? 0.5 : 0.515);
  const rx = Math.min(width * (width < 680 ? 0.38 : 0.39), height * 0.43);
  const ry = Math.min(width * (width < 680 ? 0.21 : 0.16), height * 0.22);
  const a = s * TAU - Math.PI / 2;

  const x = cx + Math.cos(a) * rx;
  const y = cy + Math.sin(a) * ry;
  const dx = -Math.sin(a) * rx;
  const dy = Math.cos(a) * ry;

  return {
    x,
    y,
    angle: Math.atan2(dy, dx),
  };
}

function circularGap(behind: Car, ahead: Car): number {
  let gap = ahead.s - behind.s;
  if (gap <= 0) gap += 1;
  return Math.max(0.0001, gap - CAR_LENGTH);
}

function idmAcceleration(car: Car, ahead: Car): number {
  const gap = circularGap(car, ahead);
  const closing = car.speed - ahead.speed;
  const dynamicGap =
    MIN_GAP +
    car.speed * TARGET_HEADWAY +
    (car.speed * closing) / (2 * Math.sqrt(ACCEL * BRAKE));

  const freeRoad = Math.pow(car.speed / Math.max(car.desiredSpeed, 0.001), 4);
  const interaction = Math.pow(Math.max(0, dynamicGap) / gap, 2);
  return ACCEL * (1 - freeRoad - interaction);
}

function nearestCar(
  width: number,
  height: number,
  x: number,
  y: number,
  maxDistance = 48,
): number {
  let nearest = -1;
  let nearestDistance = maxDistance;

  for (let index = 0; index < cars.length; index += 1) {
    const point = trackPoint(width, height, cars[index].s);
    const d = dist({ x, y }, point);
    if (d < nearestDistance) {
      nearest = index;
      nearestDistance = d;
    }
  }

  return nearest;
}

function simulate(
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  pointerDown: boolean,
  dtSeconds: number,
): void {
  if (paused || cars.length === 0) return;

  const accelerations = new Array<number>(cars.length).fill(0);

  for (let index = 0; index < cars.length; index += 1) {
    const car = cars[index];
    const ahead = cars[(index + 1) % cars.length];

    let accel = idmAcceleration(car, ahead);

    if (car.brake > 0) {
      accel = Math.min(accel, -0.13);
      car.brake = Math.max(0, car.brake - dtSeconds);
    }

    if (pointerDown) {
      const point = trackPoint(width, height, car.s);
      const d = Math.hypot(point.x - pointerX, point.y - pointerY);
      if (d < 74) {
        const pressure = 1 - d / 74;
        accel = Math.min(accel, -0.08 - pressure * 0.08);
      }
    }

    accelerations[index] = accel;
  }

  for (let index = 0; index < cars.length; index += 1) {
    const car = cars[index];
    car.speed = clamp(
      car.speed + accelerations[index] * dtSeconds,
      0.0005,
      MAX_SPEED,
    );
  }

  for (const car of cars) {
    car.s = (car.s + car.speed * dtSeconds + 1) % 1;
  }

  cars.sort((a, b) => a.s - b.s);
}

function speedColor(speed: number): string {
  const t = clamp(speed / MAX_SPEED, 0, 1);
  if (t < 0.28) {
    return "rgba(255,154,118,0.95)";
  }
  if (t < 0.62) {
    return "rgba(255,211,162,0.92)";
  }
  return "rgba(190,220,255,0.94)";
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  point: TrackPoint,
  car: Car,
  scale: number,
  highlighted: boolean,
): void {
  const length = 13 * scale;
  const width = 4.2 * scale;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(point.angle);

  if (car.speed < MAX_SPEED * 0.35) {
    ctx.fillStyle = "rgba(255,118,96,0.17)";
    ctx.beginPath();
    ctx.ellipse(-length * 0.7, 0, length * 1.15, width * 1.8, 0, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = speedColor(car.speed);
  ctx.beginPath();
  ctx.roundRect(-length / 2, -width / 2, length, width, width * 0.45);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillRect(length * 0.18, -width * 0.26, length * 0.14, width * 0.52);

  if (car.speed < MAX_SPEED * 0.45 || car.brake > 0) {
    ctx.fillStyle = "rgba(255,94,82,0.95)";
    ctx.fillRect(-length * 0.48, -width * 0.31, 1.8 * scale, 1.3 * scale);
    ctx.fillRect(-length * 0.48, width * 0.05, 1.8 * scale, 1.3 * scale);
  }

  if (highlighted) {
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(
      -length * 0.7,
      -width * 1.05,
      length * 1.4,
      width * 2.1,
      width,
    );
    ctx.stroke();
  }

  ctx.restore();
}

function jamStats(): { slow: number; mean: number } {
  if (cars.length === 0) return { slow: 0, mean: 0 };

  let slow = 0;
  let total = 0;
  for (const car of cars) {
    total += car.speed;
    if (car.speed < MAX_SPEED * 0.38) slow += 1;
  }

  return {
    slow,
    mean: total / cars.length,
  };
}

if (cars.length === 0) reset();

export const phantomRoom: RoomModule = {
  id: "phantom",
  title: "XVII · Phantom",
  copy: "Everyone moves forward. The jam travels backward.",
  hint:
    "click a driver to brake · hold near the lane for a bottleneck · Space pause · R reset",

  enter({ setStatus }): void {
    setStatus("phantom / local rules only");
  },

  draw({ stage }, dt): void {
    const dtSeconds = Math.min(dt, 32) / 1000;

    simulate(
      stage.width,
      stage.height,
      stage.pointer.x,
      stage.pointer.y,
      stage.pointer.down,
      dtSeconds,
    );

    const { ctx, width, height } = stage;
    stage.clear("#03050a");
    stage.drawStars(0.045);

    const cx = width / 2;
    const cy = height * (width < 680 ? 0.5 : 0.515);
    const rx = Math.min(width * (width < 680 ? 0.38 : 0.39), height * 0.43);
    const ry = Math.min(width * (width < 680 ? 0.21 : 0.16), height * 0.22);

    ctx.save();
    ctx.strokeStyle = "rgba(214,226,255,0.09)";
    ctx.lineWidth = width < 680 ? 18 : 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.stroke();

    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = "rgba(255,255,255,0.065)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.965, ry * 0.965, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const hovered =
      stage.pointer.active
        ? nearestCar(width, height, stage.pointer.x, stage.pointer.y, 36)
        : -1;

    const carScale = width < 680 ? 0.78 : width >= 1200 ? 1.1 : 0.95;

    for (let index = 0; index < cars.length; index += 1) {
      const point = trackPoint(width, height, cars[index].s);
      drawCar(ctx, point, cars[index], carScale, index === hovered);
    }

    if (stage.pointer.down) {
      ctx.strokeStyle = "rgba(255,188,155,0.24)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(stage.pointer.x, stage.pointer.y, 74, 0, TAU);
      ctx.stroke();
    }

    const stats = jamStats();
    const flow = clamp(stats.mean / MAX_SPEED, 0, 1);

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle =
      stats.slow >= 8
        ? "rgba(255,203,170,0.82)"
        : "rgba(232,240,255,0.44)";
    ctx.fillText(
      stats.slow >= 8
        ? "A wave exists that no driver intended."
        : "Tap one driver. Watch the hesitation travel.",
      cx,
      Math.min(height - 82, cy + ry + 78),
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.26)";
    ctx.fillText(
      `FLOW ${flow.toFixed(2)} · SLOW ${stats.slow}${paused ? " · PAUSED" : ""}`,
      cx,
      Math.min(height - 58, cy + ry + 100),
    );
  },

  click({ stage, setStatus }, x, y): void {
    const index = nearestCar(stage.width, stage.height, x, y, 56);
    if (index < 0) {
      setStatus("phantom / click closer to a driver");
      return;
    }

    cars[index].brake = 1.05;
    cars[index].speed *= 0.32;
    setStatus("phantom / one local hesitation");
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset(0);
      env.setStatus("phantom / canonical traffic restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "phantom / paused" : "phantom / flowing");
    }
  },
};
