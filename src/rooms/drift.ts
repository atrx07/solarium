import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type TrailPoint = {
  x: number;
  y: number;
  theta: number;
};

type Puck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: TrailPoint[];
};

type Layout = {
  cx: number;
  cy: number;
  radius: number;
  railLeft: number;
  railRight: number;
  railY: number;
};

const MAX_PUCKS = 18;
const MAX_TRAIL = 150;
const PUCK_SPEED = 0.42;
const OMEGA_LIMIT = 1.15;

let pucks: Puck[] = [];
let theta = 0;
let omega = 0.72;
let paused = false;
let floorFrame = true;

function layoutFor(width: number, height: number): Layout {
  const mobile = width < 680;
  const radius = Math.min(
    width * (mobile ? 0.39 : 0.29),
    height * (mobile ? 0.28 : 0.34),
  );
  const cx = width / 2;
  const cy = height * (mobile ? 0.44 : 0.47);
  const railWidth = Math.min(width * (mobile ? 0.74 : 0.44), 560);

  return {
    cx,
    cy,
    radius,
    railLeft: cx - railWidth / 2,
    railRight: cx + railWidth / 2,
    railY: Math.min(height - 56, cy + radius + (mobile ? 88 : 78)),
  };
}

function rotate(
  x: number,
  y: number,
  angle: number,
): { x: number; y: number } {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
  };
}

function displayedPoint(
  x: number,
  y: number,
  pointTheta: number,
): { x: number; y: number } {
  return floorFrame ? rotate(x, y, -pointTheta) : { x, y };
}

function reset(): void {
  pucks = [];
  theta = 0;
  omega = 0.72;
  paused = false;
  floorFrame = true;
}

function railContains(layout: Layout, x: number, y: number): boolean {
  return (
    x >= layout.railLeft - 10 &&
    x <= layout.railRight + 10 &&
    Math.abs(y - layout.railY) <= 24
  );
}

function omegaFromRail(layout: Layout, x: number): number {
  const u = clamp(
    (x - layout.railLeft) /
      Math.max(1, layout.railRight - layout.railLeft),
    0,
    1,
  );
  return (u * 2 - 1) * OMEGA_LIMIT;
}

function screenVectorToFrame(
  layout: Layout,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: (x - layout.cx) / layout.radius,
    y: (y - layout.cy) / layout.radius,
  };
}

function launch(layout: Layout, x: number, y: number): boolean {
  const pointer = screenVectorToFrame(layout, x, y);
  const length = Math.hypot(pointer.x, pointer.y);
  if (length < 0.08 || length > 1.08) return false;

  const frameDirection = {
    x: pointer.x / length,
    y: pointer.y / length,
  };
  const inertialDirection = floorFrame
    ? rotate(frameDirection.x, frameDirection.y, theta)
    : frameDirection;

  const puck: Puck = {
    x: 0,
    y: 0,
    vx: inertialDirection.x * PUCK_SPEED,
    vy: inertialDirection.y * PUCK_SPEED,
    trail: [{ x: 0, y: 0, theta }],
  };

  if (pucks.length >= MAX_PUCKS) pucks.shift();
  pucks.push(puck);
  return true;
}

function simulate(dtSeconds: number): void {
  if (paused) return;

  theta += omega * dtSeconds;

  for (const puck of pucks) {
    puck.x += puck.vx * dtSeconds;
    puck.y += puck.vy * dtSeconds;

    const last = puck.trail[puck.trail.length - 1];
    if (
      !last ||
      Math.hypot(puck.x - last.x, puck.y - last.y) > 0.009
    ) {
      puck.trail.push({ x: puck.x, y: puck.y, theta });
      if (puck.trail.length > MAX_TRAIL) puck.trail.shift();
    }
  }

  pucks = pucks.filter(
    (puck) => Math.hypot(puck.x, puck.y) <= 1.34,
  );
}

function drawDiscGrid(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  angle: number,
): void {
  const { cx, cy, radius } = layout;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.strokeStyle = "rgba(213,228,255,0.095)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();

  for (const factor of [0.33, 0.66]) {
    ctx.strokeStyle = "rgba(213,228,255,0.045)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * factor, 0, TAU);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(213,228,255,0.06)";
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(angle) * radius * 0.12,
      Math.sin(angle) * radius * 0.12,
    );
    ctx.lineTo(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
    );
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,222,178,0.2)";
  ctx.beginPath();
  ctx.moveTo(radius * 0.76, -7);
  ctx.lineTo(radius * 0.94, 0);
  ctx.lineTo(radius * 0.76, 7);
  ctx.stroke();

  ctx.restore();
}

function drawInertialCompass(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  angle: number,
): void {
  const { cx, cy, radius } = layout;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.strokeStyle = "rgba(146,199,255,0.14)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);

  ctx.beginPath();
  ctx.moveTo(-radius * 1.15, 0);
  ctx.lineTo(radius * 1.15, 0);
  ctx.moveTo(0, -radius * 1.15);
  ctx.lineTo(0, radius * 1.15);
  ctx.stroke();

  ctx.setLineDash([]);

  for (let index = 0; index < 4; index += 1) {
    const a = (index / 4) * TAU;
    const x = Math.cos(a) * radius * 1.11;
    const y = Math.sin(a) * radius * 1.11;

    ctx.fillStyle = "rgba(166,211,255,0.42)";
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function trailToScreen(
  layout: Layout,
  point: TrailPoint,
): { x: number; y: number } {
  const displayed = displayedPoint(
    point.x,
    point.y,
    point.theta,
  );
  return {
    x: layout.cx + displayed.x * layout.radius,
    y: layout.cy + displayed.y * layout.radius,
  };
}

function puckToScreen(
  layout: Layout,
  puck: Puck,
): { x: number; y: number } {
  const displayed = displayedPoint(puck.x, puck.y, theta);
  return {
    x: layout.cx + displayed.x * layout.radius,
    y: layout.cy + displayed.y * layout.radius,
  };
}

function drawPucks(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
): void {
  for (const puck of pucks) {
    if (puck.trail.length > 1) {
      ctx.beginPath();

      puck.trail.forEach((point, index) => {
        const p = trailToScreen(layout, point);
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });

      ctx.strokeStyle = floorFrame
        ? "rgba(255,213,163,0.28)"
        : "rgba(167,210,255,0.3)";
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }

    const p = puckToScreen(layout, puck);

    ctx.fillStyle = floorFrame
      ? "rgba(255,231,197,0.92)"
      : "rgba(211,235,255,0.92)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.6, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7.5, 0, TAU);
    ctx.stroke();
  }
}

function drawRail(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
): void {
  const { railLeft, railRight, railY } = layout;
  const u = (omega / OMEGA_LIMIT + 1) * 0.5;
  const knobX = railLeft + u * (railRight - railLeft);

  ctx.save();

  ctx.strokeStyle = "rgba(232,240,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(railLeft, railY);
  ctx.lineTo(railRight, railY);
  ctx.stroke();

  const zero = (railLeft + railRight) / 2;
  ctx.strokeStyle = "rgba(232,240,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(zero, railY - 6);
  ctx.lineTo(zero, railY + 6);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,225,181,0.88)";
  ctx.beginPath();
  ctx.arc(knobX, railY, 4, 0, TAU);
  ctx.fill();

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(232,240,255,0.26)";
  ctx.fillText(
    `FLOOR SPIN ${omega >= 0 ? "+" : ""}${omega.toFixed(2)} rad/s`,
    (railLeft + railRight) / 2,
    railY - 15,
  );

  ctx.restore();
}

export const driftRoom: RoomModule = {
  id: "drift",
  title: "XXIII · Drift",
  copy: "The puck goes straight. The rotating floor draws a curve beneath it.",
  hint:
    "click inside disc to launch · click spin rail to tune · F switches frame · C clears · Space pause · R restore",

  enter({ setStatus }): void {
    setStatus("drift / rotating floor frame");
  },

  draw({ stage }, dt): void {
    simulate(Math.min(dt, 32) / 1000);

    const { ctx, width, height } = stage;
    const layout = layoutFor(width, height);

    stage.clear("#03050a");
    stage.drawStars(0.025);

    const floorAngle = floorFrame ? 0 : theta;
    const inertialAngle = floorFrame ? -theta : 0;

    drawInertialCompass(ctx, layout, inertialAngle);
    drawDiscGrid(ctx, layout, floorAngle);
    drawPucks(ctx, layout);

    ctx.fillStyle = "rgba(237,244,255,0.7)";
    ctx.beginPath();
    ctx.arc(layout.cx, layout.cy, 3, 0, TAU);
    ctx.fill();

    if (stage.pointer.active) {
      const vector = screenVectorToFrame(
        layout,
        stage.pointer.x,
        stage.pointer.y,
      );
      const length = Math.hypot(vector.x, vector.y);

      if (length <= 1.08 && length >= 0.08) {
        ctx.strokeStyle = "rgba(255,238,211,0.18)";
        ctx.beginPath();
        ctx.moveTo(layout.cx, layout.cy);
        ctx.lineTo(stage.pointer.x, stage.pointer.y);
        ctx.stroke();
      }
    }

    drawRail(ctx, layout);

    const messageY = Math.min(
      height - 88,
      layout.cy + layout.radius + 38,
    );

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = floorFrame
      ? "rgba(255,225,184,0.74)"
      : "rgba(199,225,255,0.7)";
    ctx.fillText(
      floorFrame
        ? "No sideways force was added. The frame supplied the bend."
        : "In the inertial frame, every puck keeps its straight promise.",
      width / 2,
      messageY,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.24)";
    ctx.fillText(
      `${floorFrame ? "ROTATING FLOOR" : "INERTIAL FRAME"} · PUCKS ${pucks.length}${paused ? " · PAUSED" : ""}`,
      width / 2,
      messageY + 23,
    );
  },

  click({ stage, setStatus }, x, y): void {
    const layout = layoutFor(stage.width, stage.height);

    if (railContains(layout, x, y)) {
      omega = omegaFromRail(layout, x);
      setStatus("drift / floor rotation changed");
      return;
    }

    if (launch(layout, x, y)) {
      setStatus("drift / inertial puck launched");
    } else {
      setStatus("drift / launch from inside the disc");
    }
  },

  key(env, event): void {
    const key = event.key.toLowerCase();

    if (key === "f") {
      floorFrame = !floorFrame;
      env.setStatus(
        floorFrame
          ? "drift / rotating floor frame"
          : "drift / inertial frame",
      );
      return;
    }

    if (key === "c") {
      pucks = [];
      env.setStatus("drift / chamber cleared");
      return;
    }

    if (key === "r") {
      reset();
      env.setStatus("drift / canonical turntable restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "drift / paused" : "drift / rotating");
    }
  },
};
