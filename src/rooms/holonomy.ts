import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Vec2 = {
  x: number;
  y: number;
};

type Projected = Vec2 & {
  depth: number;
};

type Segment = {
  from: Vec3;
  to: Vec3;
  axis: Vec3;
  angle: number;
  vector: Vec3;
};

const CANONICAL_ALPHA = Math.PI * 0.52;
const MIN_ALPHA = Math.PI * 0.14;
const MAX_ALPHA = Math.PI * 0.88;
const CIRCUIT_SECONDS = 5.4;
const CAMERA_YAW = -0.62;
const CAMERA_PITCH = 0.58;

const NORTH: Vec3 = { x: 0, y: 0, z: 1 };
const A: Vec3 = { x: 1, y: 0, z: 0 };
const INITIAL_VECTOR: Vec3 = { x: 0, y: 1, z: 0 };

let alpha = CANONICAL_ALPHA;
let locked = false;
let running = false;
let progress = 0;
let completed = false;

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(a: Vec3, amount: number): Vec3 {
  return { x: a.x * amount, y: a.y * amount, z: a.z * amount };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function length(a: Vec3): number {
  return Math.hypot(a.x, a.y, a.z);
}

function normalize(a: Vec3): Vec3 {
  const magnitude = Math.max(length(a), 1e-9);
  return scale(a, 1 / magnitude);
}

function rotateAroundAxis(vector: Vec3, axis: Vec3, angle: number): Vec3 {
  const n = normalize(axis);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(
    add(scale(vector, c), scale(cross(n, vector), s)),
    scale(n, dot(n, vector) * (1 - c)),
  );
}

function segmentFor(from: Vec3, to: Vec3, vector: Vec3): Segment {
  const cosine = clamp(dot(from, to), -1, 1);
  const angle = Math.acos(cosine);
  return {
    from,
    to,
    axis: normalize(cross(from, to)),
    angle,
    vector,
  };
}

function triangleVertices(): [Vec3, Vec3, Vec3, Vec3] {
  const b = {
    x: Math.cos(alpha),
    y: Math.sin(alpha),
    z: 0,
  };
  return [NORTH, A, b, NORTH];
}

function buildSegments(): Segment[] {
  const vertices = triangleVertices();
  const segments: Segment[] = [];
  let vector = INITIAL_VECTOR;

  for (let index = 0; index < 3; index += 1) {
    const segment = segmentFor(vertices[index], vertices[index + 1], vector);
    segments.push(segment);
    vector = rotateAroundAxis(vector, segment.axis, segment.angle);
  }

  return segments;
}

function finalVector(): Vec3 {
  const segments = buildSegments();
  const last = segments[segments.length - 1];
  return normalize(rotateAroundAxis(last.vector, last.axis, last.angle));
}

function signedAngleAtNorth(from: Vec3, to: Vec3): number {
  const x = dot(cross(from, to), NORTH);
  const y = clamp(dot(from, to), -1, 1);
  return Math.atan2(x, y);
}

function holonomyAngle(): number {
  return signedAngleAtNorth(INITIAL_VECTOR, finalVector());
}

function rotateCamera(point: Vec3): Vec3 {
  const yawed = rotateAroundAxis(point, { x: 0, y: 0, z: 1 }, CAMERA_YAW);
  return rotateAroundAxis(yawed, { x: 1, y: 0, z: 0 }, CAMERA_PITCH);
}

function layoutFor(width: number, height: number): { center: Vec2; radius: number } {
  const mobile = width < 680;
  return {
    center: {
      x: width * 0.5,
      y: height * (mobile ? 0.43 : 0.47),
    },
    radius: Math.min(
      width * (mobile ? 0.4 : 0.285),
      height * (mobile ? 0.25 : 0.335),
    ),
  };
}

function project(point: Vec3, width: number, height: number): Projected {
  const layout = layoutFor(width, height);
  const camera = rotateCamera(point);
  return {
    x: layout.center.x + camera.x * layout.radius,
    y: layout.center.y - camera.z * layout.radius,
    depth: camera.y,
  };
}

function pointOnSegment(segment: Segment, t: number): Vec3 {
  return normalize(
    rotateAroundAxis(segment.from, segment.axis, segment.angle * clamp(t, 0, 1)),
  );
}

function vectorOnSegment(segment: Segment, t: number): Vec3 {
  return normalize(
    rotateAroundAxis(segment.vector, segment.axis, segment.angle * clamp(t, 0, 1)),
  );
}

function currentTraveler(): { point: Vec3; vector: Vec3; segmentIndex: number } {
  const segments = buildSegments();
  const scaled = clamp(progress, 0, 0.999999) * segments.length;
  const segmentIndex = Math.min(segments.length - 1, Math.floor(scaled));
  const local = scaled - segmentIndex;
  const segment = segments[segmentIndex];

  if (completed && progress >= 1) {
    return { point: NORTH, vector: finalVector(), segmentIndex: 2 };
  }

  return {
    point: pointOnSegment(segment, local),
    vector: vectorOnSegment(segment, local),
    segmentIndex,
  };
}

function updateAlphaFromPointer(width: number, x: number): void {
  if (locked || running) return;
  const u = clamp(x / Math.max(width, 1), 0, 1);
  alpha = MIN_ALPHA + u * (MAX_ALPHA - MIN_ALPHA);
  progress = 0;
  completed = false;
}

function reset(): void {
  alpha = CANONICAL_ALPHA;
  locked = false;
  running = false;
  progress = 0;
  completed = false;
}

function drawSphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const layout = layoutFor(width, height);

  ctx.save();
  const glow = ctx.createRadialGradient(
    layout.center.x - layout.radius * 0.28,
    layout.center.y - layout.radius * 0.32,
    layout.radius * 0.06,
    layout.center.x,
    layout.center.y,
    layout.radius * 1.08,
  );
  glow.addColorStop(0, "rgba(198,225,255,0.1)");
  glow.addColorStop(0.72, "rgba(75,105,155,0.035)");
  glow.addColorStop(1, "rgba(5,7,14,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(layout.center.x, layout.center.y, layout.radius, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(215,230,255,0.14)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(layout.center.x, layout.center.y, layout.radius, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  points: Vec3[],
  frontColor: string,
  backColor: string,
  lineWidth: number,
): void {
  if (points.length < 2) return;

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = project(points[index], width, height);
    const b = project(points[index + 1], width, height);
    const depth = (a.depth + b.depth) * 0.5;

    ctx.strokeStyle = depth >= 0 ? frontColor : backColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function greatCircleSamples(axis: Vec3, start: Vec3, turns = 1): Vec3[] {
  const samples: Vec3[] = [];
  const count = 72;

  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    samples.push(rotateAroundAxis(start, axis, TAU * turns * t));
  }

  return samples;
}

function segmentSamples(segment: Segment): Vec3[] {
  const count = 42;
  const samples: Vec3[] = [];
  for (let index = 0; index <= count; index += 1) {
    samples.push(pointOnSegment(segment, index / count));
  }
  return samples;
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const latitudes = [-0.62, -0.32, 0, 0.32, 0.62];

  for (const z of latitudes) {
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const points: Vec3[] = [];
    for (let index = 0; index <= 72; index += 1) {
      const angle = (index / 72) * TAU;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), z });
    }
    drawCurve(
      ctx,
      width,
      height,
      points,
      "rgba(195,218,255,0.065)",
      "rgba(195,218,255,0.018)",
      1,
    );
  }

  for (let index = 0; index < 8; index += 1) {
    const longitude = (index / 8) * TAU;
    const normal = { x: -Math.sin(longitude), y: Math.cos(longitude), z: 0 };
    const start = { x: Math.cos(longitude), y: Math.sin(longitude), z: 0 };
    drawCurve(
      ctx,
      width,
      height,
      greatCircleSamples(normal, start),
      "rgba(195,218,255,0.055)",
      "rgba(195,218,255,0.014)",
      1,
    );
  }
}

function drawTriangle(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const segments = buildSegments();

  segments.forEach((segment, index) => {
    drawCurve(
      ctx,
      width,
      height,
      segmentSamples(segment),
      index === 1
        ? "rgba(255,211,158,0.64)"
        : "rgba(220,235,255,0.48)",
      index === 1
        ? "rgba(255,211,158,0.11)"
        : "rgba(220,235,255,0.075)",
      1.65,
    );
  });

  const vertices = triangleVertices().slice(0, 3);
  vertices.forEach((point, index) => {
    const p = project(point, width, height);
    ctx.fillStyle = index === 0
      ? "rgba(255,238,205,0.9)"
      : "rgba(205,227,255,0.72)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, index === 0 ? 4.2 : 3.2, 0, TAU);
    ctx.fill();
  });
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  point: Vec3,
  vector: Vec3,
  color: string,
  alphaValue: number,
  scaleValue = 0.24,
): void {
  const start = project(point, width, height);
  const tangentTip = normalize(add(point, scale(vector, scaleValue)));
  const tip = project(tangentTip, width, height);
  const dx = tip.x - start.x;
  const dy = tip.y - start.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const head = 6.5;

  ctx.save();
  ctx.globalAlpha = alphaValue;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - ux * head - uy * head * 0.55, tip.y - uy * head + ux * head * 0.55);
  ctx.lineTo(tip.x - ux * head + uy * head * 0.55, tip.y - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTraveler(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const traveler = currentTraveler();
  const p = project(traveler.point, width, height);

  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "rgba(255,203,144,0.74)";
  ctx.fillStyle = "rgba(255,235,202,0.96)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  drawArrow(
    ctx,
    width,
    height,
    traveler.point,
    traveler.vector,
    "rgba(255,224,181,0.95)",
    1,
  );
}

function drawComparison(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  drawArrow(
    ctx,
    width,
    height,
    NORTH,
    INITIAL_VECTOR,
    "rgba(166,207,255,0.7)",
    completed ? 0.62 : 0.23,
    0.29,
  );

  if (completed) {
    drawArrow(
      ctx,
      width,
      height,
      NORTH,
      finalVector(),
      "rgba(255,213,158,0.95)",
      1,
      0.29,
    );
  }
}

function simulate(dtSeconds: number): boolean {
  if (!running) return false;

  progress += dtSeconds / CIRCUIT_SECONDS;
  if (progress < 1) return false;

  progress = 1;
  running = false;
  completed = true;
  return true;
}

function alphaDegrees(): number {
  return (alpha * 180) / Math.PI;
}

function signedDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function statusMessage(): string {
  if (running) return "Carry the arrow without turning it. The surface does the turning.";
  if (completed) return "Same point. Different direction. Curvature kept the difference.";
  return "Change the triangle. Its enclosed area sets the returned rotation.";
}

export const holonomyRoom: RoomModule = {
  id: "holonomy",
  title: "XXVII · Holonomy",
  copy: "Walk a direction around curved space. Return to the point, not the orientation.",
  hint:
    "move horizontally to change enclosed area · click locks geometry · Space transports once · R restore",

  enter({ setStatus }): void {
    setStatus("holonomy / sphere ready · vector at north");
  },

  draw({ stage, setStatus }, dt): void {
    if (stage.pointer.active) {
      updateAlphaFromPointer(stage.width, stage.pointer.x);
    }

    const finished = simulate(Math.min(dt, 32) / 1000);
    if (finished) {
      setStatus(
        `holonomy / returned ${signedDegrees(holonomyAngle()) >= 0 ? "+" : ""}${signedDegrees(holonomyAngle()).toFixed(1)}°`,
      );
    }

    const { ctx, width, height } = stage;
    stage.clear("#03050a");
    stage.drawStars(0.025);

    drawSphere(ctx, width, height);
    drawGrid(ctx, width, height);
    drawTriangle(ctx, width, height);
    drawComparison(ctx, width, height);
    drawTraveler(ctx, width, height);

    const layout = layoutFor(width, height);
    const messageY = Math.min(height - 82, layout.center.y + layout.radius + 58);
    const holonomy = signedDegrees(holonomyAngle());

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = completed
      ? "rgba(255,224,181,0.84)"
      : "rgba(218,233,255,0.62)";
    ctx.fillText(statusMessage(), width / 2, messageY);

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.28)";
    ctx.fillText(
      `SPHERICAL AREA ${alphaDegrees().toFixed(1)}° · HOLONOMY ${holonomy >= 0 ? "+" : ""}${holonomy.toFixed(1)}° · ${locked ? "GEOMETRY LOCKED" : "MOVE TO TUNE"}${running ? ` · ${(progress * 100).toFixed(0)}%` : ""}`,
      width / 2,
      messageY + 24,
    );
  },

  click({ setStatus }): void {
    if (running) {
      setStatus("holonomy / finish the transport before changing geometry");
      return;
    }

    locked = !locked;
    setStatus(
      locked
        ? "holonomy / geometry locked"
        : "holonomy / geometry follows pointer",
    );
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("holonomy / canonical triangle restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();

      if (running) {
        running = false;
        progress = 0;
        completed = false;
        env.setStatus("holonomy / transport cancelled");
        return;
      }

      progress = 0;
      completed = false;
      running = true;
      locked = true;
      env.setStatus("holonomy / parallel transport underway");
    }
  },
};
