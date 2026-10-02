import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

type SpaceEvent = {
  x: number;
  t: number;
  label: string;
  user: boolean;
};

type Layout = {
  cx: number;
  cy: number;
  half: number;
  scale: number;
  range: number;
  railLeft: number;
  railRight: number;
  railY: number;
};

const CANONICAL_EVENTS: SpaceEvent[] = [
  { x: -0.62, t: 0.28, label: "A", user: false },
  { x: 0.62, t: 0.28, label: "B", user: false },
];

const MAX_USER_EVENTS = 5;
const BETA_LIMIT = 0.88;

let beta = 0;
let userEvents: SpaceEvent[] = [];

function layoutFor(width: number, height: number): Layout {
  const mobile = width < 680;
  const half = Math.min(
    width * (mobile ? 0.42 : 0.34),
    height * (mobile ? 0.255 : 0.31),
  );
  const range = 1.22;
  const cx = width / 2;
  const cy = height * (mobile ? 0.45 : 0.47);
  const railWidth = Math.min(width * (mobile ? 0.78 : 0.5), 640);

  return {
    cx,
    cy,
    half,
    scale: half / range,
    range,
    railLeft: cx - railWidth / 2,
    railRight: cx + railWidth / 2,
    railY: Math.min(height - 72, cy + half + (mobile ? 96 : 88)),
  };
}

function gamma(value: number): number {
  return 1 / Math.sqrt(1 - value * value);
}

function toScreen(
  layout: Layout,
  x: number,
  t: number,
): { x: number; y: number } {
  return {
    x: layout.cx + x * layout.scale,
    y: layout.cy - t * layout.scale,
  };
}

function fromScreen(
  layout: Layout,
  sx: number,
  sy: number,
): { x: number; t: number } {
  return {
    x: (sx - layout.cx) / layout.scale,
    t: (layout.cy - sy) / layout.scale,
  };
}

function lorentz(
  x: number,
  t: number,
): { xPrime: number; tPrime: number } {
  const g = gamma(beta);
  return {
    xPrime: g * (x - beta * t),
    tPrime: g * (t - beta * x),
  };
}

function inverseLorentz(
  xPrime: number,
  tPrime: number,
): { x: number; t: number } {
  const g = gamma(beta);
  return {
    x: g * (xPrime + beta * tPrime),
    t: g * (tPrime + beta * xPrime),
  };
}

function insidePlot(layout: Layout, x: number, y: number): boolean {
  return (
    x >= layout.cx - layout.half &&
    x <= layout.cx + layout.half &&
    y >= layout.cy - layout.half &&
    y <= layout.cy + layout.half
  );
}

function insideRail(layout: Layout, x: number, y: number): boolean {
  return (
    x >= layout.railLeft - 10 &&
    x <= layout.railRight + 10 &&
    Math.abs(y - layout.railY) <= 28
  );
}

function betaFromRail(layout: Layout, x: number): number {
  const u = clamp(
    (x - layout.railLeft) / Math.max(1, layout.railRight - layout.railLeft),
    0,
    1,
  );
  return (u * 2 - 1) * BETA_LIMIT;
}

function eventTime(event: SpaceEvent): number {
  return lorentz(event.x, event.t).tPrime;
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  a: { x: number; t: number },
  b: { x: number; t: number },
): void {
  const p0 = toScreen(layout, a.x, a.t);
  const p1 = toScreen(layout, b.x, b.t);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

function drawTransformedGrid(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
): void {
  const values = [-1, -0.5, 0.5, 1];

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    layout.cx - layout.half,
    layout.cy - layout.half,
    layout.half * 2,
    layout.half * 2,
  );
  ctx.clip();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(178,205,255,0.055)";

  for (const fixedX of values) {
    const a = inverseLorentz(fixedX, -1.8);
    const b = inverseLorentz(fixedX, 1.8);
    drawSegment(ctx, layout, a, b);
  }

  ctx.strokeStyle = "rgba(255,214,166,0.05)";
  for (const fixedT of values) {
    const a = inverseLorentz(-1.8, fixedT);
    const b = inverseLorentz(1.8, fixedT);
    drawSegment(ctx, layout, a, b);
  }

  ctx.restore();
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
): void {
  const r = layout.range;

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    layout.cx - layout.half,
    layout.cy - layout.half,
    layout.half * 2,
    layout.half * 2,
  );
  ctx.clip();

  ctx.lineWidth = 1;

  ctx.strokeStyle = "rgba(234,241,255,0.12)";
  drawSegment(ctx, layout, { x: -r, t: 0 }, { x: r, t: 0 });
  drawSegment(ctx, layout, { x: 0, t: -r }, { x: 0, t: r });

  ctx.setLineDash([5, 7]);
  ctx.strokeStyle = "rgba(255,255,255,0.11)";
  drawSegment(ctx, layout, { x: -r, t: -r }, { x: r, t: r });
  drawSegment(ctx, layout, { x: -r, t: r }, { x: r, t: -r });
  ctx.setLineDash([]);

  // t' = 0 : the moving observer's line of simultaneity, its "now".
  ctx.strokeStyle = "rgba(255,213,162,0.48)";
  ctx.lineWidth = 1.5;
  drawSegment(
    ctx,
    layout,
    { x: -r, t: -beta * r },
    { x: r, t: beta * r },
  );

  // x' = 0 : the moving observer's worldline.
  ctx.strokeStyle = "rgba(169,205,255,0.45)";
  const tSpan = r / Math.max(1, Math.abs(beta));
  drawSegment(
    ctx,
    layout,
    { x: -beta * tSpan, t: -tSpan },
    { x: beta * tSpan, t: tSpan },
  );

  ctx.restore();

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(232,240,255,0.28)";
  ctx.textAlign = "left";
  ctx.fillText("x", layout.cx + layout.half + 8, layout.cy + 3);
  ctx.fillText("ct", layout.cx + 6, layout.cy - layout.half - 8);
}

function drawEvent(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  event: SpaceEvent,
): void {
  const p = toScreen(layout, event.x, event.t);
  const transformed = lorentz(event.x, event.t);

  ctx.save();

  ctx.strokeStyle = event.user
    ? "rgba(211,224,255,0.42)"
    : "rgba(255,228,183,0.74)";
  ctx.lineWidth = event.user ? 1 : 1.4;
  ctx.beginPath();
  ctx.arc(p.x, p.y, event.user ? 4 : 5.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = event.user
    ? "rgba(214,229,255,0.56)"
    : "rgba(255,238,204,0.92)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, event.user ? 1.7 : 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = event.user
    ? "rgba(225,235,255,0.38)"
    : "rgba(255,236,203,0.7)";
  ctx.fillText(
    `${event.label}  t′ ${transformed.tPrime >= 0 ? "+" : ""}${transformed.tPrime.toFixed(2)}`,
    p.x + 9,
    p.y - 7,
  );

  ctx.restore();
}

function drawRail(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
): void {
  ctx.save();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(232,240,255,0.14)";
  ctx.beginPath();
  ctx.moveTo(layout.railLeft, layout.railY);
  ctx.lineTo(layout.railRight, layout.railY);
  ctx.stroke();

  const zeroX = (layout.railLeft + layout.railRight) / 2;
  ctx.strokeStyle = "rgba(232,240,255,0.2)";
  ctx.beginPath();
  ctx.moveTo(zeroX, layout.railY - 7);
  ctx.lineTo(zeroX, layout.railY + 7);
  ctx.stroke();

  const u = (beta / BETA_LIMIT + 1) * 0.5;
  const knobX =
    layout.railLeft + u * (layout.railRight - layout.railLeft);

  ctx.fillStyle = "rgba(255,226,183,0.9)";
  ctx.beginPath();
  ctx.arc(knobX, layout.railY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(232,240,255,0.28)";
  ctx.textAlign = "left";
  ctx.fillText("-0.88c", layout.railLeft, layout.railY + 22);
  ctx.textAlign = "right";
  ctx.fillText("+0.88c", layout.railRight, layout.railY + 22);
  ctx.textAlign = "center";
  ctx.fillText(
    `OBSERVER ${beta >= 0 ? "+" : ""}${beta.toFixed(3)}c`,
    layout.cx,
    layout.railY - 16,
  );

  ctx.restore();
}

function canonicalOrder(): string {
  const a = eventTime(CANONICAL_EVENTS[0]);
  const b = eventTime(CANONICAL_EVENTS[1]);
  const delta = a - b;

  if (Math.abs(delta) < 0.025) {
    return "A and B share a now in this frame.";
  }

  return delta < 0
    ? "A happens before B in this frame."
    : "B happens before A in this frame.";
}

function nearestUserEvent(
  layout: Layout,
  px: number,
  py: number,
): number {
  let nearest = -1;
  let best = 18;

  for (let index = 0; index < userEvents.length; index += 1) {
    const p = toScreen(layout, userEvents[index].x, userEvents[index].t);
    const d = Math.hypot(p.x - px, p.y - py);
    if (d < best) {
      best = d;
      nearest = index;
    }
  }

  return nearest;
}

function addOrRemoveEvent(
  layout: Layout,
  px: number,
  py: number,
): boolean {
  const existing = nearestUserEvent(layout, px, py);
  if (existing >= 0) {
    userEvents.splice(existing, 1);
    return false;
  }

  const point = fromScreen(layout, px, py);
  const label = String.fromCharCode(67 + userEvents.length);

  if (userEvents.length >= MAX_USER_EVENTS) {
    userEvents.shift();
  }

  userEvents.push({
    x: clamp(point.x, -layout.range, layout.range),
    t: clamp(point.t, -layout.range, layout.range),
    label,
    user: true,
  });

  return true;
}

export const elsewhenRoom: RoomModule = {
  id: "elsewhen",
  title: "XX · Elsewhen",
  copy: "Change your motion. Watch what counts as now tilt.",
  hint:
    "drag the velocity rail · click the diagram to place/remove events · Space rest frame · C clear · R restore",

  enter({ setStatus }): void {
    setStatus("elsewhen / simultaneity is frame-dependent");
  },

  draw({ stage }): void {
    const { ctx, width, height } = stage;
    const layout = layoutFor(width, height);

    if (
      stage.pointer.down &&
      insideRail(layout, stage.pointer.x, stage.pointer.y)
    ) {
      beta = betaFromRail(layout, stage.pointer.x);
    }

    stage.clear("#03050a");
    stage.drawStars(0.05);

    ctx.save();
    ctx.strokeStyle = "rgba(224,234,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      layout.cx - layout.half,
      layout.cy - layout.half,
      layout.half * 2,
      layout.half * 2,
    );
    ctx.restore();

    drawTransformedGrid(ctx, layout);
    drawAxes(ctx, layout);

    for (const event of CANONICAL_EVENTS) {
      drawEvent(ctx, layout, event);
    }
    for (const event of userEvents) {
      drawEvent(ctx, layout, event);
    }

    if (
      stage.pointer.active &&
      insidePlot(layout, stage.pointer.x, stage.pointer.y) &&
      !stage.pointer.down
    ) {
      const p = fromScreen(
        layout,
        stage.pointer.x,
        stage.pointer.y,
      );
      const transformed = lorentz(p.x, p.t);

      ctx.strokeStyle = "rgba(231,239,255,0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(stage.pointer.x, stage.pointer.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(232,240,255,0.28)";
      ctx.fillText(
        `x′ ${transformed.xPrime.toFixed(2)} · t′ ${transformed.tPrime.toFixed(2)}`,
        stage.pointer.x + 12,
        stage.pointer.y - 10,
      );
    }

    drawRail(ctx, layout);

    const messageY = Math.min(height - 28, layout.railY + 52);
    ctx.textAlign = "center";
    ctx.font =
      "500 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle =
      Math.abs(beta) < 0.03
        ? "rgba(232,240,255,0.46)"
        : "rgba(255,226,183,0.78)";
    ctx.fillText(canonicalOrder(), width / 2, messageY);
  },

  click({ stage, setStatus }, x, y): void {
    const layout = layoutFor(stage.width, stage.height);

    if (insideRail(layout, x, y)) {
      beta = betaFromRail(layout, x);
      setStatus("elsewhen / observer velocity changed");
      return;
    }

    if (!insidePlot(layout, x, y)) {
      setStatus("elsewhen / click inside spacetime");
      return;
    }

    const added = addOrRemoveEvent(layout, x, y);
    setStatus(
      added
        ? "elsewhen / event placed"
        : "elsewhen / event removed",
    );
  },

  key(env, event): void {
    const key = event.key.toLowerCase();

    if (key === "r") {
      beta = 0;
      userEvents = [];
      env.setStatus("elsewhen / canonical frame restored");
      return;
    }

    if (key === "c") {
      userEvents = [];
      env.setStatus("elsewhen / user events cleared");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      beta = 0;
      env.setStatus("elsewhen / rest frame");
    }
  },
};
