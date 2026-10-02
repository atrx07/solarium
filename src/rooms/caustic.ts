import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Vec = {
  x: number;
  y: number;
};

type Ray = {
  entry: Vec;
  hit: Vec;
  reflected: Vec;
  exit: Vec;
};

const CANONICAL_ANGLE = 0.18;

let incomingAngle = CANONICAL_ANGLE;
let locked = false;
let causticLens = false;

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(a: Vec, amount: number): Vec {
  return { x: a.x * amount, y: a.y * amount };
}

function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Vec, b: Vec): number {
  return a.x * b.y - a.y * b.x;
}

function length(a: Vec): number {
  return Math.hypot(a.x, a.y);
}

function normalize(a: Vec): Vec {
  const magnitude = Math.max(length(a), 1e-9);
  return { x: a.x / magnitude, y: a.y / magnitude };
}

function direction(): Vec {
  return {
    x: Math.cos(incomingAngle),
    y: Math.sin(incomingAngle),
  };
}

function perpendicular(a: Vec): Vec {
  return { x: -a.y, y: a.x };
}

function reflect(vector: Vec, normal: Vec): Vec {
  return subtract(vector, scale(normal, 2 * dot(vector, normal)));
}

function makeRay(offset: number, incoming: Vec): Ray {
  const across = perpendicular(incoming);
  const longitudinal = Math.sqrt(Math.max(0, 1 - offset * offset));

  const base = scale(across, offset);
  const entry = subtract(base, scale(incoming, longitudinal));
  const hit = add(base, scale(incoming, longitudinal));
  const normal = normalize(hit);
  const reflected = normalize(reflect(incoming, normal));

  const exitDistance = Math.max(0, -2 * dot(hit, reflected));
  const exit = add(hit, scale(reflected, exitDistance));

  return {
    entry,
    hit,
    reflected,
    exit,
  };
}

function intersectReflected(a: Ray, b: Ray): Vec | undefined {
  const denominator = cross(a.reflected, b.reflected);
  if (Math.abs(denominator) < 1e-7) return undefined;

  const separation = subtract(b.hit, a.hit);
  const ta = cross(separation, b.reflected) / denominator;
  const tb = cross(separation, a.reflected) / denominator;

  if (ta <= 0 || tb <= 0) return undefined;

  const point = add(a.hit, scale(a.reflected, ta));
  if (length(point) > 1.001) return undefined;

  return point;
}

function layoutFor(width: number, height: number): {
  cx: number;
  cy: number;
  radius: number;
} {
  const mobile = width < 680;
  return {
    cx: width / 2,
    cy: height * (mobile ? 0.44 : 0.47),
    radius: Math.min(
      width * (mobile ? 0.42 : 0.34),
      height * (mobile ? 0.25 : 0.34),
    ),
  };
}

function toScreen(
  point: Vec,
  cx: number,
  cy: number,
  radius: number,
): Vec {
  return {
    x: cx + point.x * radius,
    y: cy + point.y * radius,
  };
}

function updateDirectionFromPointer(
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
): void {
  if (locked) return;

  const layout = layoutFor(width, height);
  const sourceVector = {
    x: layout.cx - pointerX,
    y: layout.cy - pointerY,
  };

  if (length(sourceVector) < 34) return;

  const d = normalize(sourceVector);
  incomingAngle = Math.atan2(d.y, d.x);
}

function drawMirror(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.save();

  ctx.strokeStyle = "rgba(214,230,255,0.13)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = "rgba(214,230,255,0.035)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, TAU);
  ctx.stroke();

  ctx.restore();
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  incoming: Vec,
): void {
  const source = {
    x: cx - incoming.x * (radius + 42),
    y: cy - incoming.y * (radius + 42),
  };

  ctx.save();

  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(255,219,166,0.8)";
  ctx.fillStyle = "rgba(255,231,191,0.92)";
  ctx.beginPath();
  ctx.arc(source.x, source.y, 4.2, 0, TAU);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,226,182,0.34)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(source.x, source.y, 10, 0, TAU);
  ctx.stroke();

  ctx.restore();
}

function drawRayFamily(
  ctx: CanvasRenderingContext2D,
  rays: Ray[],
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.save();
  ctx.lineWidth = 1;

  for (const ray of rays) {
    const entry = toScreen(ray.entry, cx, cy, radius);
    const hit = toScreen(ray.hit, cx, cy, radius);
    const exit = toScreen(ray.exit, cx, cy, radius);

    ctx.strokeStyle = causticLens
      ? "rgba(182,211,255,0.022)"
      : "rgba(170,207,255,0.065)";
    ctx.beginPath();
    ctx.moveTo(entry.x, entry.y);
    ctx.lineTo(hit.x, hit.y);
    ctx.stroke();

    ctx.strokeStyle = causticLens
      ? "rgba(255,215,167,0.065)"
      : "rgba(255,215,167,0.13)";
    ctx.beginPath();
    ctx.moveTo(hit.x, hit.y);
    ctx.lineTo(exit.x, exit.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCaustic(
  ctx: CanvasRenderingContext2D,
  rays: Ray[],
  cx: number,
  cy: number,
  radius: number,
): number {
  const points: Vec[] = [];

  for (let index = 0; index < rays.length - 1; index += 1) {
    const point = intersectReflected(rays[index], rays[index + 1]);
    if (point) points.push(point);
  }

  if (points.length < 2) return points.length;

  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = causticLens ? 18 : 11;
  ctx.shadowColor = "rgba(255,213,156,0.72)";
  ctx.strokeStyle = causticLens
    ? "rgba(255,226,180,0.82)"
    : "rgba(255,219,169,0.46)";
  ctx.lineWidth = causticLens ? 1.7 : 1.15;

  ctx.beginPath();
  points.forEach((point, index) => {
    const p = toScreen(point, cx, cy, radius);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = causticLens
    ? "rgba(255,237,203,0.7)"
    : "rgba(255,229,188,0.34)";

  for (let index = 0; index < points.length; index += 3) {
    const p = toScreen(points[index], cx, cy, radius);
    ctx.beginPath();
    ctx.arc(p.x, p.y, causticLens ? 1.55 : 1.1, 0, TAU);
    ctx.fill();
  }

  ctx.restore();

  return points.length;
}

function sourceAngleDegrees(): number {
  let degrees = (incomingAngle * 180) / Math.PI;
  degrees %= 360;
  if (degrees < 0) degrees += 360;
  return degrees;
}

export const causticRoom: RoomModule = {
  id: "caustic",
  title: "XXV · Caustic",
  copy: "No ray follows the bright curve. The crowd creates it.",
  hint:
    "move around chamber to aim light · click locks direction · Space switches RAYS/CAUSTIC · R restore",

  enter({ setStatus }): void {
    setStatus("caustic / rays lens · light free");
  },

  draw({ stage }): void {
    const { ctx, width, height } = stage;
    const layout = layoutFor(width, height);

    if (stage.pointer.active) {
      updateDirectionFromPointer(
        width,
        height,
        stage.pointer.x,
        stage.pointer.y,
      );
    }

    const incoming = direction();
    const rayCount = width < 680 ? 82 : 148;
    const rays: Ray[] = [];

    for (let index = 0; index < rayCount; index += 1) {
      const u = index / Math.max(1, rayCount - 1);
      const offset = -0.965 + u * 1.93;
      rays.push(makeRay(offset, incoming));
    }

    stage.clear("#03050a");
    stage.drawStars(0.025);

    drawMirror(ctx, layout.cx, layout.cy, layout.radius);
    drawRayFamily(
      ctx,
      rays,
      layout.cx,
      layout.cy,
      layout.radius,
    );
    const envelopePoints = drawCaustic(
      ctx,
      rays,
      layout.cx,
      layout.cy,
      layout.radius,
    );
    drawSource(
      ctx,
      layout.cx,
      layout.cy,
      layout.radius,
      incoming,
    );

    const messageY = Math.min(
      height - 86,
      layout.cy + layout.radius + (width < 680 ? 62 : 56),
    );

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = causticLens
      ? "rgba(255,229,188,0.82)"
      : "rgba(220,234,255,0.58)";
    ctx.fillText(
      causticLens
        ? "The curve is an envelope. None of its rays travel along it."
        : "Ordinary reflections. Extraordinary crowding.",
      width / 2,
      messageY,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.25)";
    ctx.fillText(
      `${causticLens ? "CAUSTIC" : "RAYS"} · ${rayCount} RAYS · ENVELOPE ${envelopePoints} · LIGHT ${sourceAngleDegrees().toFixed(1)}°${locked ? " · LOCKED" : ""}`,
      width / 2,
      messageY + 24,
    );
  },

  click({ setStatus }): void {
    locked = !locked;
    setStatus(
      locked
        ? "caustic / light direction locked"
        : "caustic / light direction free",
    );
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      incomingAngle = CANONICAL_ANGLE;
      locked = false;
      causticLens = false;
      env.setStatus("caustic / canonical rays restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      causticLens = !causticLens;
      env.setStatus(
        causticLens
          ? "caustic / envelope lens"
          : "caustic / rays lens",
      );
    }
  },
};
