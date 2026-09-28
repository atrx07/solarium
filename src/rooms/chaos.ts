import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type WorldPoint = {
  x: number;
  y: number;
};

type Pendulum = {
  a1: number;
  a2: number;
  w1: number;
  w2: number;
  trail: WorldPoint[];
};

const COUNT = 17;
const EPSILON = 0.00014;
const LENGTH = 1;
const MASS_1 = 1;
const MASS_2 = 1;
const GRAVITY = 9.81;
const DEFAULT_A1 = 2.23;
const DEFAULT_A2 = -0.9;

let pendulums: Pendulum[] = [];
let paused = false;
let speed = 1;

function bobPositions(pendulum: Pendulum): {
  first: WorldPoint;
  second: WorldPoint;
} {
  const first = {
    x: LENGTH * Math.sin(pendulum.a1),
    y: LENGTH * Math.cos(pendulum.a1),
  };

  return {
    first,
    second: {
      x: first.x + LENGTH * Math.sin(pendulum.a2),
      y: first.y + LENGTH * Math.cos(pendulum.a2),
    },
  };
}

function seed(a1 = DEFAULT_A1, a2 = DEFAULT_A2): void {
  const middle = (COUNT - 1) / 2;

  pendulums = Array.from({ length: COUNT }, (_, index) => {
    const offset = index - middle;
    return {
      a1: a1 + offset * EPSILON,
      a2: a2 - offset * EPSILON * 0.63,
      w1: 0,
      w2: 0,
      trail: [] as WorldPoint[],
    };
  });
}

function acceleration(pendulum: Pendulum): { a1: number; a2: number } {
  const { a1, a2, w1, w2 } = pendulum;
  const delta = a1 - a2;
  const common =
    2 * MASS_1 +
    MASS_2 -
    MASS_2 * Math.cos(2 * a1 - 2 * a2);

  const first =
    (-GRAVITY * (2 * MASS_1 + MASS_2) * Math.sin(a1) -
      MASS_2 * GRAVITY * Math.sin(a1 - 2 * a2) -
      2 *
        Math.sin(delta) *
        MASS_2 *
        (w2 * w2 * LENGTH + w1 * w1 * LENGTH * Math.cos(delta))) /
    (LENGTH * common);

  const second =
    (2 *
      Math.sin(delta) *
      (w1 * w1 * LENGTH * (MASS_1 + MASS_2) +
        GRAVITY * (MASS_1 + MASS_2) * Math.cos(a1) +
        w2 * w2 * LENGTH * MASS_2 * Math.cos(delta))) /
    (LENGTH * common);

  return { a1: first, a2: second };
}

function step(pendulum: Pendulum, dt: number): void {
  const alpha = acceleration(pendulum);

  pendulum.w1 += alpha.a1 * dt;
  pendulum.w2 += alpha.a2 * dt;
  pendulum.a1 += pendulum.w1 * dt;
  pendulum.a2 += pendulum.w2 * dt;
}

function advance(dtMs: number): void {
  if (paused) return;

  const seconds = (Math.min(dtMs, 32) / 1000) * speed;
  const substeps = clamp(Math.ceil(seconds / (1 / 180)), 1, 24);
  const dt = seconds / substeps;

  for (let i = 0; i < substeps; i += 1) {
    for (const pendulum of pendulums) {
      step(pendulum, dt);
    }
  }

  for (const pendulum of pendulums) {
    pendulum.trail.push(bobPositions(pendulum).second);
    if (pendulum.trail.length > 150) pendulum.trail.shift();
  }
}

function reseedFromPoint(
  width: number,
  height: number,
  x: number,
  y: number,
): void {
  const nx = clamp(x / Math.max(width, 1), 0, 1);
  const ny = clamp(y / Math.max(height, 1), 0, 1);

  const a1 = (0.35 + nx * 1.3) * Math.PI;
  const a2 = (-0.9 + ny * 1.8) * Math.PI;
  seed(a1, a2);
}

function divergence(): number {
  if (pendulums.length === 0) return 0;

  const reference = bobPositions(pendulums[Math.floor(COUNT / 2)]).second;
  let maximum = 0;

  for (const pendulum of pendulums) {
    const point = bobPositions(pendulum).second;
    maximum = Math.max(maximum, Math.hypot(point.x - reference.x, point.y - reference.y));
  }

  return maximum;
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: WorldPoint[],
  pivotX: number,
  pivotY: number,
  scale: number,
  index: number,
): void {
  if (trail.length < 2) return;

  ctx.beginPath();
  trail.forEach((point, trailIndex) => {
    const x = pivotX + point.x * scale;
    const y = pivotY + point.y * scale;
    if (trailIndex === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const hue = 186 + index * 5.1;
  ctx.strokeStyle = `hsla(${hue}, 78%, 72%, 0.16)`;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  pendulum: Pendulum,
  pivotX: number,
  pivotY: number,
  scale: number,
  index: number,
): void {
  const points = bobPositions(pendulum);
  const first = {
    x: pivotX + points.first.x * scale,
    y: pivotY + points.first.y * scale,
  };
  const second = {
    x: pivotX + points.second.x * scale,
    y: pivotY + points.second.y * scale,
  };

  const hue = 186 + index * 5.1;
  const reference = index === Math.floor(COUNT / 2);

  ctx.strokeStyle = reference
    ? "rgba(255,255,255,0.48)"
    : `hsla(${hue}, 64%, 76%, 0.16)`;
  ctx.lineWidth = reference ? 1.25 : 0.65;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(first.x, first.y);
  ctx.lineTo(second.x, second.y);
  ctx.stroke();

  ctx.fillStyle = reference
    ? "rgba(255,255,255,0.94)"
    : `hsla(${hue}, 82%, 78%, 0.64)`;

  ctx.beginPath();
  ctx.arc(first.x, first.y, reference ? 2.6 : 1.6, 0, TAU);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(second.x, second.y, reference ? 3.2 : 1.9, 0, TAU);
  ctx.fill();
}

if (pendulums.length === 0) seed();

export const chaosRoom: RoomModule = {
  id: "chaos",
  title: "IX · Chaos",
  copy: "Seventeen almost-identical beginnings disagree about the future.",
  hint: "click chooses a beginning · F accelerates · R restores · space pauses",

  enter({ stage }): void {
    if (pendulums.length === 0) seed();
    stage.pointer.down = false;
  },

  draw({ stage }, dt): void {
    stage.clear("#030306");
    stage.drawStars(0.13);
    advance(dt);

    const pivotX = stage.width / 2;
    const pivotY = stage.height * 0.34;
    const scale = Math.min(stage.width, stage.height) * 0.16;

    stage.glow(
      pivotX,
      pivotY,
      30,
      "rgba(240,244,255,0.2)",
      "rgba(100,125,220,0)",
    );

    stage.ctx.save();
    stage.ctx.globalCompositeOperation = "lighter";

    pendulums.forEach((pendulum, index) => {
      drawTrail(stage.ctx, pendulum.trail, pivotX, pivotY, scale, index);
    });

    pendulums.forEach((pendulum, index) => {
      drawPendulum(stage.ctx, pendulum, pivotX, pivotY, scale, index);
    });

    stage.ctx.restore();

    stage.ctx.fillStyle = "rgba(255,255,255,0.9)";
    stage.ctx.beginPath();
    stage.ctx.arc(pivotX, pivotY, 3, 0, TAU);
    stage.ctx.fill();

    const delta = divergence();
    const mode = paused ? "PAUSED" : speed > 1 ? `${speed}×` : "1×";

    stage.ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    stage.ctx.textAlign = "left";
    stage.ctx.fillStyle = "rgba(255,255,255,0.28)";
    stage.ctx.fillText(
      `${COUNT} TRAJECTORIES / Δ ${delta.toExponential(2)} / ${mode}`,
      28,
      stage.height - 74,
    );
  },

  click({ stage, setStatus }, x, y): void {
    reseedFromPoint(stage.width, stage.height, x, y);
    setStatus("chaos / new beginning");
  },

  key(env, event): void {
    const key = event.key.toLowerCase();

    if (key === "r") {
      seed();
      env.setStatus("chaos / beginnings restored");
      return;
    }

    if (key === "f") {
      speed = speed === 1 ? 4 : 1;
      env.setStatus(`chaos / ${speed}x time`);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "chaos / paused" : "chaos / awake");
    }
  },
};
