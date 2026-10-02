import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Vec = {
  x: number;
  y: number;
};

type TrailSample = {
  z: Vec;
  w: Vec;
};

type PlaneLayout = {
  z: { x: number; y: number };
  w: { x: number; y: number };
  radius: number;
  mobile: boolean;
};

const CANONICAL_RADIUS = 0.62;
const CANONICAL_ANGLE = 0.42;
const MIN_RADIUS = 0.075;
const MAX_RADIUS = 0.94;
const TRAIL_LIMIT = 220;
const AUTO_DURATION = 2.7;

let zRadius = CANONICAL_RADIUS;
let unwrappedAngle = CANONICAL_ANGLE;
let lastPointerAngle: number | undefined;
let autoRemaining = 0;
let autoDirection = 1;
let trail: TrailSample[] = [];

function wrapSigned(value: number): number {
  let wrapped = ((value + Math.PI) % TAU + TAU) % TAU - Math.PI;
  if (wrapped === -Math.PI) wrapped = Math.PI;
  return wrapped;
}

function principalAngle(value: number): number {
  return wrapSigned(value);
}

function zValue(): Vec {
  return {
    x: zRadius * Math.cos(unwrappedAngle),
    y: zRadius * Math.sin(unwrappedAngle),
  };
}

function wValue(): Vec {
  const radius = Math.sqrt(zRadius);
  const angle = unwrappedAngle / 2;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

function otherRoot(): Vec {
  const w = wValue();
  return { x: -w.x, y: -w.y };
}

function branchIndex(): number {
  return Math.floor((unwrappedAngle + Math.PI) / TAU);
}

function sheetLabel(): "A" | "B" {
  const parity = ((branchIndex() % 2) + 2) % 2;
  return parity === 0 ? "A" : "B";
}

function continuationTurns(): number {
  return (unwrappedAngle - CANONICAL_ANGLE) / TAU;
}

function appendTrail(force = false): void {
  const z = zValue();
  const w = wValue();
  const previous = trail[trail.length - 1];

  if (
    !force &&
    previous &&
    Math.hypot(z.x - previous.z.x, z.y - previous.z.y) < 0.012 &&
    Math.hypot(w.x - previous.w.x, w.y - previous.w.y) < 0.012
  ) {
    return;
  }

  trail.push({ z, w });
  if (trail.length > TRAIL_LIMIT) trail.shift();
}

function reset(): void {
  zRadius = CANONICAL_RADIUS;
  unwrappedAngle = CANONICAL_ANGLE;
  lastPointerAngle = undefined;
  autoRemaining = 0;
  autoDirection = 1;
  trail = [];
  appendTrail(true);
}

function layoutFor(width: number, height: number): PlaneLayout {
  const mobile = width < 680;

  if (mobile) {
    const radius = Math.min(width * 0.34, height * 0.155);
    return {
      mobile,
      radius,
      z: { x: width * 0.5, y: height * 0.32 },
      w: { x: width * 0.5, y: height * 0.66 },
    };
  }

  const radius = Math.min(width * 0.205, height * 0.27);
  return {
    mobile,
    radius,
    z: { x: width * 0.29, y: height * 0.48 },
    w: { x: width * 0.71, y: height * 0.48 },
  };
}

function toScreen(point: Vec, center: Vec, radius: number): Vec {
  return {
    x: center.x + point.x * radius,
    y: center.y - point.y * radius,
  };
}

function pointInZPlane(
  layout: PlaneLayout,
  x: number,
  y: number,
): { angle: number; radius: number; rawRadius: number } | undefined {
  const dx = (x - layout.z.x) / Math.max(layout.radius, 1);
  const dy = -(y - layout.z.y) / Math.max(layout.radius, 1);
  const rawRadius = Math.hypot(dx, dy);

  if (rawRadius > 1.04) return undefined;

  return {
    angle: Math.atan2(dy, dx),
    radius: clamp(rawRadius, MIN_RADIUS, MAX_RADIUS),
    rawRadius,
  };
}

function continueTo(
  layout: PlaneLayout,
  x: number,
  y: number,
): "outside" | "singularity" | "moved" {
  const point = pointInZPlane(layout, x, y);
  if (!point) {
    lastPointerAngle = undefined;
    return "outside";
  }

  if (point.rawRadius < MIN_RADIUS) {
    lastPointerAngle = undefined;
    return "singularity";
  }

  const reference =
    lastPointerAngle === undefined
      ? principalAngle(unwrappedAngle)
      : lastPointerAngle;

  unwrappedAngle += wrapSigned(point.angle - reference);
  lastPointerAngle = point.angle;
  zRadius = point.radius;
  appendTrail();
  return "moved";
}

function advanceAuto(dtSeconds: number): boolean {
  if (autoRemaining <= 0) return false;

  const step = Math.min(
    autoRemaining,
    (TAU / AUTO_DURATION) * Math.max(0, dtSeconds),
  );

  unwrappedAngle += step * autoDirection;
  autoRemaining -= step;
  appendTrail();

  if (autoRemaining <= 1e-6) {
    autoRemaining = 0;
    lastPointerAngle = undefined;
    return true;
  }

  return false;
}

function drawPlane(
  ctx: CanvasRenderingContext2D,
  center: Vec,
  radius: number,
  label: string,
  branchCut: boolean,
): void {
  ctx.save();

  ctx.strokeStyle = "rgba(218,231,255,0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = "rgba(218,231,255,0.055)";
  ctx.beginPath();
  ctx.moveTo(center.x - radius, center.y);
  ctx.lineTo(center.x + radius, center.y);
  ctx.moveTo(center.x, center.y - radius);
  ctx.lineTo(center.x, center.y + radius);
  ctx.stroke();

  if (branchCut) {
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(255,197,148,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center.x - radius, center.y);
    ctx.lineTo(center.x - radius * 0.06, center.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,203,158,0.32)";
    ctx.fillText("BRANCH CUT", center.x - radius + 8, center.y - 10);
  }

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(218,231,255,0.3)";
  ctx.fillText(label, center.x, center.y - radius - 18);

  ctx.restore();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  center: Vec,
  radius: number,
  select: (sample: TrailSample) => Vec,
  color: string,
  alphaScale = 1,
): void {
  if (trail.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();

  trail.forEach((sample, index) => {
    const p = toScreen(select(sample), center, radius);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });

  ctx.globalAlpha = alphaScale;
  ctx.stroke();
  ctx.restore();
}

function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: Vec,
  center: Vec,
  radius: number,
  fill: string,
  glow: string,
  size: number,
): Vec {
  const p = toScreen(point, center, radius);

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = glow;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size, 0, TAU);
  ctx.fill();
  ctx.restore();

  return p;
}

function drawSingularity(
  ctx: CanvasRenderingContext2D,
  center: Vec,
): void {
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "rgba(255,165,120,0.72)";
  ctx.fillStyle = "rgba(255,205,170,0.9)";
  ctx.beginPath();
  ctx.arc(center.x, center.y, 3.3, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255,197,154,0.24)";
  ctx.beginPath();
  ctx.arc(center.x, center.y, 10, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawRootPair(
  ctx: CanvasRenderingContext2D,
  layout: PlaneLayout,
): void {
  const chosen = wValue();
  const other = otherRoot();
  const chosenScreen = toScreen(chosen, layout.w, layout.radius);
  const otherScreen = toScreen(other, layout.w, layout.radius);

  ctx.save();
  ctx.strokeStyle = "rgba(218,231,255,0.075)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chosenScreen.x, chosenScreen.y);
  ctx.lineTo(otherScreen.x, otherScreen.y);
  ctx.stroke();
  ctx.restore();

  drawPoint(
    ctx,
    other,
    layout.w,
    layout.radius,
    "rgba(173,210,255,0.54)",
    "rgba(132,193,255,0.38)",
    3.4,
  );

  drawPoint(
    ctx,
    chosen,
    layout.w,
    layout.radius,
    "rgba(255,235,203,0.96)",
    "rgba(255,196,132,0.8)",
    5,
  );

  ctx.save();
  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(255,224,185,0.52)";
  ctx.textAlign = "left";
  ctx.fillText("FOLLOWED", chosenScreen.x + 10, chosenScreen.y - 8);
  ctx.fillStyle = "rgba(173,210,255,0.34)";
  ctx.fillText("OTHER", otherScreen.x + 10, otherScreen.y - 8);
  ctx.restore();
}

function message(): string {
  if (autoRemaining > 0) {
    return "Following one continuous circuit. Watch the roots exchange places.";
  }

  const turns = continuationTurns();
  if (Math.abs(turns) >= 1.75) {
    return "Two turns can bring the followed root home.";
  }

  if (sheetLabel() === "B") {
    return "Same base point. The continuation now lives on the other sheet.";
  }

  return "Circle the branch point. The root turns at half the angle.";
}

if (trail.length === 0) appendTrail(true);

export const monodromyRoom: RoomModule = {
  id: "monodromy",
  title: "XXVI · Monodromy",
  copy: "Walk once around the hole. You come back carrying the other answer.",
  hint:
    "move inside the left plane · Space traces one loop · Shift+Space reverses · C clears trail · R restore",

  enter({ setStatus }): void {
    setStatus(`monodromy / sheet ${sheetLabel()} · continuous root`);
  },

  draw({ stage, setStatus }, dt): void {
    const layout = layoutFor(stage.width, stage.height);

    if (autoRemaining <= 0 && stage.pointer.active) {
      const result = continueTo(
        layout,
        stage.pointer.x,
        stage.pointer.y,
      );

      if (result === "outside") lastPointerAngle = undefined;
    }

    const finished = advanceAuto(Math.min(dt, 32) / 1000);
    if (finished) {
      setStatus(
        `monodromy / circuit complete · sheet ${sheetLabel()}`,
      );
    }

    const { ctx, width, height } = stage;
    stage.clear("#03050a");
    stage.drawStars(0.025);

    drawPlane(ctx, layout.z, layout.radius, "BASE PLANE · z", true);
    drawPlane(ctx, layout.w, layout.radius, "ROOT PLANE · w² = z", false);

    drawTrail(
      ctx,
      layout.z,
      layout.radius,
      (sample) => sample.z,
      "rgba(174,210,255,0.25)",
    );
    drawTrail(
      ctx,
      layout.w,
      layout.radius,
      (sample) => sample.w,
      "rgba(255,211,165,0.32)",
    );
    drawTrail(
      ctx,
      layout.w,
      layout.radius,
      (sample) => ({ x: -sample.w.x, y: -sample.w.y }),
      "rgba(161,205,255,0.12)",
      0.8,
    );

    drawSingularity(ctx, layout.z);

    const z = zValue();
    const zScreen = drawPoint(
      ctx,
      z,
      layout.z,
      layout.radius,
      "rgba(220,237,255,0.95)",
      "rgba(156,207,255,0.68)",
      4.6,
    );

    ctx.save();
    ctx.strokeStyle = "rgba(190,220,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(layout.z.x, layout.z.y);
    ctx.lineTo(zScreen.x, zScreen.y);
    ctx.stroke();
    ctx.restore();

    drawRootPair(ctx, layout);

    const statusY = layout.mobile
      ? Math.min(height - 78, layout.w.y + layout.radius + 44)
      : Math.min(height - 82, layout.z.y + layout.radius + 54);

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle =
      sheetLabel() === "B"
        ? "rgba(255,221,181,0.82)"
        : "rgba(218,233,255,0.64)";
    ctx.fillText(message(), width / 2, statusY);

    const zAngle = (principalAngle(unwrappedAngle) * 180) / Math.PI;
    const rootRadius = Math.sqrt(zRadius);

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.28)";
    ctx.fillText(
      `ARG z ${zAngle >= 0 ? "+" : ""}${zAngle.toFixed(1)}° · |z| ${zRadius.toFixed(2)} · |√z| ${rootRadius.toFixed(2)} · SHEET ${sheetLabel()} · CONTINUATION ${continuationTurns() >= 0 ? "+" : ""}${continuationTurns().toFixed(2)} turns`,
      width / 2,
      statusY + 24,
    );
  },

  click({ stage, setStatus }, x, y): void {
    const layout = layoutFor(stage.width, stage.height);
    const point = pointInZPlane(layout, x, y);

    if (!point) {
      setStatus("monodromy / choose a point in the base plane");
      return;
    }

    if (point.rawRadius < MIN_RADIUS) {
      setStatus("monodromy / branch point · continuation cannot pass through zero");
      return;
    }

    autoRemaining = 0;
    lastPointerAngle = undefined;
    continueTo(layout, x, y);
    setStatus(`monodromy / sheet ${sheetLabel()} · point chosen`);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("monodromy / canonical branch restored");
      return;
    }

    if (event.key.toLowerCase() === "c") {
      trail = [];
      appendTrail(true);
      env.setStatus("monodromy / trail cleared");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();

      if (autoRemaining > 0) {
        autoRemaining = 0;
        lastPointerAngle = undefined;
        env.setStatus("monodromy / guided circuit cancelled");
        return;
      }

      autoDirection = event.shiftKey ? -1 : 1;
      autoRemaining = TAU;
      lastPointerAngle = undefined;
      env.setStatus(
        autoDirection > 0
          ? "monodromy / tracing one counterclockwise circuit"
          : "monodromy / tracing one clockwise circuit",
      );
    }
  },
};
