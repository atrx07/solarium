import type { RoomModule } from "../core/room";
import type { Point } from "../core/stage";
import { TAU, clamp, rand } from "../core/stage";

type LensSeed = {
  u: number;
  v: number;
  radius: number;
  index: number;
  phase: number;
  drift: number;
};

type Lens = {
  x: number;
  y: number;
  radius: number;
  index: number;
};

type Vec = {
  x: number;
  y: number;
};

const spectrum = [
  { stroke: "rgba(255,120,128,0.13)", indexOffset: -0.012 },
  { stroke: "rgba(170,225,255,0.11)", indexOffset: 0 },
  { stroke: "rgba(135,145,255,0.14)", indexOffset: 0.018 },
];

let lenses: LensSeed[] = [];

function normalize(vector: Vec): Vec {
  const length = Math.max(Math.hypot(vector.x, vector.y), 0.000001);
  return { x: vector.x / length, y: vector.y / length };
}

function resetLenses(): void {
  lenses = [
    { u: 0.31, v: 0.38, radius: 0.085, index: 1.46, phase: 0.4, drift: 0.014 },
    { u: 0.54, v: 0.61, radius: 0.115, index: 1.38, phase: 2.1, drift: 0.011 },
    { u: 0.72, v: 0.36, radius: 0.072, index: 1.58, phase: 4.2, drift: 0.018 },
    { u: 0.82, v: 0.69, radius: 0.055, index: 1.51, phase: 5.4, drift: 0.012 },
  ];
}

function resolvedLenses(
  width: number,
  height: number,
  time: number,
  densityBoost: number,
): Lens[] {
  const scale = Math.min(width, height);

  return lenses.map((lens) => ({
    x:
      lens.u * width +
      Math.cos(time * 0.00019 + lens.phase) * lens.drift * scale,
    y:
      lens.v * height +
      Math.sin(time * 0.00023 + lens.phase * 1.37) * lens.drift * scale,
    radius: lens.radius * scale,
    index: lens.index + densityBoost,
  }));
}

function rayCircle(origin: Point, direction: Vec, lens: Lens): number | null {
  const ox = origin.x - lens.x;
  const oy = origin.y - lens.y;
  const b = 2 * (ox * direction.x + oy * direction.y);
  const c = ox * ox + oy * oy - lens.radius * lens.radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const near = (-b - root) / 2;
  const far = (-b + root) / 2;
  const epsilon = 0.65;

  if (near > epsilon) return near;
  if (far > epsilon) return far;
  return null;
}

function distanceToEdge(
  origin: Point,
  direction: Vec,
  width: number,
  height: number,
): number {
  const candidates: number[] = [];

  if (direction.x > 0.000001) {
    candidates.push((width - origin.x) / direction.x);
  } else if (direction.x < -0.000001) {
    candidates.push((0 - origin.x) / direction.x);
  }

  if (direction.y > 0.000001) {
    candidates.push((height - origin.y) / direction.y);
  } else if (direction.y < -0.000001) {
    candidates.push((0 - origin.y) / direction.y);
  }

  return Math.min(...candidates.filter((value) => value > 0.001));
}

function refract(
  direction: Vec,
  outwardNormal: Vec,
  fromIndex: number,
  toIndex: number,
): { direction: Vec; reflected: boolean } {
  let normal = outwardNormal;
  if (direction.x * normal.x + direction.y * normal.y > 0) {
    normal = { x: -normal.x, y: -normal.y };
  }

  const eta = fromIndex / toIndex;
  const cosine = clamp(
    -(direction.x * normal.x + direction.y * normal.y),
    -1,
    1,
  );
  const discriminant = 1 - eta * eta * (1 - cosine * cosine);

  if (discriminant < 0) {
    const dot = direction.x * normal.x + direction.y * normal.y;
    return {
      direction: normalize({
        x: direction.x - 2 * dot * normal.x,
        y: direction.y - 2 * dot * normal.y,
      }),
      reflected: true,
    };
  }

  return {
    direction: normalize({
      x:
        eta * direction.x +
        (eta * cosine - Math.sqrt(discriminant)) * normal.x,
      y:
        eta * direction.y +
        (eta * cosine - Math.sqrt(discriminant)) * normal.y,
    }),
    reflected: false,
  };
}

function containingLens(point: Point, field: Lens[]): number | null {
  for (let i = 0; i < field.length; i += 1) {
    const lens = field[i];
    if (Math.hypot(point.x - lens.x, point.y - lens.y) < lens.radius - 1) {
      return i;
    }
  }
  return null;
}

function traceRay(
  ctx: CanvasRenderingContext2D,
  source: Point,
  initialDirection: Vec,
  field: Lens[],
  width: number,
  height: number,
  color: string,
  spectralOffset: number,
): void {
  let position = { ...source };
  let direction = normalize(initialDirection);
  let inside = containingLens(position, field);

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.72;

  for (let bounce = 0; bounce < 8; bounce += 1) {
    const edgeDistance = distanceToEdge(position, direction, width, height);
    let hitDistance = edgeDistance;
    let hitLens: number | null = null;

    if (inside !== null) {
      const exit = rayCircle(position, direction, field[inside]);
      if (exit !== null && exit < hitDistance) {
        hitDistance = exit;
        hitLens = inside;
      }
    } else {
      for (let i = 0; i < field.length; i += 1) {
        const hit = rayCircle(position, direction, field[i]);
        if (hit !== null && hit < hitDistance) {
          hitDistance = hit;
          hitLens = i;
        }
      }
    }

    const end = {
      x: position.x + direction.x * hitDistance,
      y: position.y + direction.y * hitDistance,
    };

    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (hitLens === null) return;

    const lens = field[hitLens];
    const outward = normalize({
      x: end.x - lens.x,
      y: end.y - lens.y,
    });

    const entering = inside === null;
    const fromIndex = entering ? 1 : lens.index + spectralOffset;
    const toIndex = entering ? lens.index + spectralOffset : 1;
    const result = refract(direction, outward, fromIndex, toIndex);

    direction = result.direction;

    if (!result.reflected) {
      inside = entering ? hitLens : null;
    }

    position = {
      x: end.x + direction.x * 0.9,
      y: end.y + direction.y * 0.9,
    };
  }
}

function addLens(
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const scale = Math.min(width, height);
  lenses.push({
    u: clamp(x / width, 0.08, 0.92),
    v: clamp(y / height, 0.12, 0.88),
    radius: rand(34, 72) / scale,
    index: rand(1.34, 1.6),
    phase: rand(0, TAU),
    drift: rand(0.006, 0.018),
  });

  if (lenses.length > 11) {
    lenses.splice(4, 1);
  }
}

function drawGlass(
  ctx: CanvasRenderingContext2D,
  field: Lens[],
  pointerDown: boolean,
): void {
  for (const lens of field) {
    const fill = ctx.createRadialGradient(
      lens.x - lens.radius * 0.3,
      lens.y - lens.radius * 0.32,
      lens.radius * 0.08,
      lens.x,
      lens.y,
      lens.radius,
    );
    fill.addColorStop(
      0,
      pointerDown ? "rgba(235,245,255,0.105)" : "rgba(235,245,255,0.075)",
    );
    fill.addColorStop(0.68, "rgba(145,170,220,0.035)");
    fill.addColorStop(1, "rgba(90,110,170,0.018)");

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.radius, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = pointerDown
      ? "rgba(225,238,255,0.26)"
      : "rgba(215,228,255,0.17)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.radius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.beginPath();
    ctx.arc(
      lens.x - lens.radius * 0.12,
      lens.y - lens.radius * 0.1,
      lens.radius * 0.68,
      Math.PI * 1.08,
      Math.PI * 1.72,
    );
    ctx.stroke();
  }
}

if (lenses.length === 0) resetLenses();

export const prismRoom: RoomModule = {
  id: "prism",
  title: "VIII · Prism",
  copy: "The shortest path changes when the room becomes glass.",
  hint: "move to become light · click adds glass · hold increases density · R restores chamber",

  draw({ stage }): void {
    stage.clear("#02040a");
    stage.drawStars(0.11);

    const densityBoost = stage.pointer.down ? 0.22 : 0;
    const field = resolvedLenses(
      stage.width,
      stage.height,
      stage.time,
      densityBoost,
    );

    drawGlass(stage.ctx, field, stage.pointer.down);

    const source = stage.pointer.active
      ? { x: stage.pointer.x, y: stage.pointer.y }
      : { x: stage.width * 0.18, y: stage.height * 0.52 };

    stage.ctx.save();
    stage.ctx.globalCompositeOperation = "lighter";

    const rayCount = 42;
    const spin = stage.time * 0.000025;

    for (let ray = 0; ray < rayCount; ray += 1) {
      const angle = spin + (ray / rayCount) * TAU;
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };

      for (const channel of spectrum) {
        traceRay(
          stage.ctx,
          source,
          direction,
          field,
          stage.width,
          stage.height,
          channel.stroke,
          channel.indexOffset,
        );
      }
    }

    stage.ctx.restore();

    stage.glow(
      source.x,
      source.y,
      stage.pointer.down ? 42 : 29,
      stage.pointer.down
        ? "rgba(255,250,230,0.42)"
        : "rgba(255,250,235,0.3)",
      "rgba(255,220,170,0)",
    );

    stage.ctx.fillStyle = "rgba(255,252,242,0.92)";
    stage.ctx.beginPath();
    stage.ctx.arc(source.x, source.y, 2.4, 0, TAU);
    stage.ctx.fill();

    stage.ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    stage.ctx.textAlign = "left";
    stage.ctx.fillStyle = "rgba(255,255,255,0.26)";
    stage.ctx.fillText(
      `${field.length} LENSES / n+${densityBoost.toFixed(2)}`,
      28,
      stage.height - 74,
    );
  },

  click({ stage }, x, y): void {
    addLens(x, y, stage.width, stage.height);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      resetLenses();
      env.setStatus("optics / chamber restored");
    }
  },
};
