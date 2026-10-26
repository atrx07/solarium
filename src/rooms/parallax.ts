import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

/**
 * Parallax: two sightings of stationary lights recover their depth.
 *
 * A perspective point at depth z shifts by -f * observer / z. The disparity
 * between two observations is therefore -f * baseline / z. Nothing about the
 * final depth is faked; the readout inverts that measured displacement.
 */
type Light = {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  label: string;
};

const probes: Light[] = [
  { x: 0.31, y: 0.42, z: 2.6, radius: 6.2, color: "#ffd5a1", label: "NEAR" },
  { x: 0.54, y: 0.62, z: 5.4, radius: 4.7, color: "#a8e3fb", label: "MIDDLE" },
  { x: 0.77, y: 0.39, z: 11.2, radius: 3.5, color: "#d9bcff", label: "FAR" },
];

type Sample = { observer: number };
let camera = 0;
let first: Sample | null = null;
let second: Sample | null = null;

function random(index: number, salt: number): number {
  let x = (index + 1) * 73856093 ^ salt * 19349663;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

const dust: Light[] = Array.from({ length: 105 }, (_, i) => ({
  x: 0.055 + random(i, 11) * 0.89,
  y: 0.2 + random(i, 23) * 0.61,
  z: 3.2 + random(i, 37) * 13,
  radius: 0.4 + random(i, 41) * 1.25,
  color: i % 5 === 0 ? "#c5d8ff" : "#f5f1e9",
  label: "",
}));

function focal(width: number, height: number): number {
  return Math.min(width * 0.58, height * 0.44);
}

function observerFromX(x: number, width: number): number {
  return clamp((x / Math.max(1, width) - 0.5) * 2, -1, 1);
}

function projectX(light: Light, observer: number, width: number, height: number): number {
  return light.x * width - focal(width, height) * observer / light.z;
}

function disparity(light: Light, a: Sample, b: Sample, width: number, height: number): number {
  return projectX(light, b.observer, width, height) - projectX(light, a.observer, width, height);
}

function recoveredDepth(light: Light, a: Sample, b: Sample, width: number, height: number): number {
  const shift = disparity(light, a, b, width, height);
  return Math.abs(shift) < 1e-6
    ? Number.POSITIVE_INFINITY
    : Math.abs(focal(width, height) * (b.observer - a.observer) / shift);
}

function capture(observer: number, setStatus: (text: string) => void): void {
  camera = observer;
  if (second) {
    first = { observer };
    second = null;
    setStatus("parallax / new first observation · find another viewpoint");
  } else if (!first) {
    first = { observer };
    setStatus("parallax / observation A recorded · move sideways and capture B");
  } else if (Math.abs(observer - first.observer) < 0.16) {
    setStatus("parallax / baseline too short · move farther from A");
  } else {
    second = { observer };
    setStatus("parallax / two sightings · disparity has revealed distance");
  }
}

function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity = 1,
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function mark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function drawProbe(
  ctx: CanvasRenderingContext2D,
  light: Light,
  observer: number,
  width: number,
  height: number,
  index: number,
): void {
  const x = projectX(light, observer, width, height);
  const y = light.y * height;
  const aura = ctx.createRadialGradient(x, y, 0, x, y, light.radius * 8);
  aura.addColorStop(0, index === 0 ? "rgba(255,204,140,0.28)" : "rgba(171,206,255,0.17)");
  aura.addColorStop(1, "rgba(10,12,22,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(x - light.radius * 8, y - light.radius * 8, light.radius * 16, light.radius * 16);
  ring(ctx, x, y, light.radius * 2.4, light.color, 0.29);
  mark(ctx, x, y, light.radius, light.color);
  ctx.textAlign = "center";
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(242,242,255,0.7)";
  ctx.fillText(light.label, x, y + light.radius * 3.7 + 7);
}

function drawComparison(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  a: Sample,
  b: Sample,
): void {
  const small = width < 680;
  probes.forEach((light, i) => {
    const y = light.y * height;
    const ax = projectX(light, a.observer, width, height);
    const bx = projectX(light, b.observer, width, height);
    const shift = disparity(light, a, b, width, height);
    const estimated = recoveredDepth(light, a, b, width, height);
    ring(ctx, ax, y, light.radius + 7, light.color, 0.54);
    ring(ctx, bx, y, light.radius + 2, light.color, 0.7);
    ctx.save();
    ctx.strokeStyle = light.color;
    ctx.globalAlpha = 0.65;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(ax, y);
    ctx.lineTo(bx, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const labelX = clamp((ax + bx) / 2, 58, width - 58);
    const labelY = y - (small ? 30 : 39);
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = light.color;
    ctx.fillText(Math.abs(shift).toFixed(1) + "px / " + estimated.toFixed(1) + "u", labelX, labelY);
    if (i === 0) {
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "rgba(246,242,233,0.5)";
      ctx.fillText("SHIFT / RECOVERED DEPTH", labelX, labelY - 16);
    }
  });
}

function drawObserverRail(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const y = height * 0.845;
  const from = width * 0.19;
  const to = width * 0.81;
  const point = (position: number): number => width * 0.5 + position * (to - from) / 2;

  ctx.strokeStyle = "rgba(208,222,244,0.21)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(from, y);
  ctx.lineTo(to, y);
  ctx.stroke();

  [-1, -0.5, 0, 0.5, 1].forEach((position) => {
    const x = point(position);
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y + 5);
    ctx.stroke();
  });

  if (first) {
    mark(ctx, point(first.observer), y, 4.2, "#ffd5a1");
    ctx.fillStyle = "#ffd5a1";
    ctx.textAlign = "center";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("A", point(first.observer), y - 14);
  }
  if (second) {
    mark(ctx, point(second.observer), y, 4.2, "#a8e3fb");
    ctx.fillStyle = "#a8e3fb";
    ctx.textAlign = "center";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("B", point(second.observer), y - 14);
  }

  const x = point(camera);
  ctx.save();
  ctx.shadowColor = "rgba(255,236,200,0.64)";
  ctx.shadowBlur = 14;
  mark(ctx, x, y, 7, "#fff4df");
  ctx.restore();

  ctx.textAlign = "center";
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(233,231,245,0.52)";
  ctx.fillText("OBSERVER BASELINE", width * 0.5, y + 26);
}

function reset(): void {
  camera = 0;
  first = null;
  second = null;
}

export const parallaxRoom: RoomModule = {
  id: "parallax",
  title: "XXVIII · Parallax",
  copy: "The stars stay still. Your position changes what they seem to say.",
  hint: "move horizontally · click/tap to capture A, then B · Space captures · R resets",

  enter(env): void {
    reset();
    env.setStatus("parallax / one world · many viewpoints");
  },

  draw(env): void {
    const { stage } = env;
    const { ctx, width, height } = stage;
    if (stage.pointer.active) camera = observerFromX(stage.pointer.x, width);

    stage.clear("#05070d");
    stage.drawStars(0.16);

    const yTop = height * 0.20;
    const yBottom = height * 0.78;
    ctx.save();
    ctx.strokeStyle = "rgba(198,216,240,0.045)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i += 1) {
      const x = i * width / 6;
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBottom);
      ctx.stroke();
    }

    for (const light of dust) {
      const x = projectX(light, camera, width, height);
      const y = light.y * height;
      if (x < 0 || x > width) continue;
      ctx.globalAlpha = clamp(0.3 + 2 / light.z, 0.3, 0.85);
      mark(ctx, x, y, light.radius, light.color);
    }
    ctx.globalAlpha = 1;

    if (first && second) drawComparison(ctx, width, height, first, second);

    probes.forEach((light, index) => drawProbe(ctx, light, camera, width, height, index));

    ctx.fillStyle = "rgba(242,236,222,0.67)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      second ? "ONE BASELINE. THREE DIFFERENT DISTANCES." :
      first ? "OBSERVATION A SAVED. CHANGE YOUR VIEWPOINT." :
      "THE NEAREST LIGHT MOVES THE MOST.",
      width * 0.5,
      height * 0.745,
    );

    drawObserverRail(ctx, width, height);
    ctx.restore();
  },

  click(env, x): void {
    capture(observerFromX(x, env.stage.width), env.setStatus);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("parallax / two observations cleared");
    }
    if (event.code === "Space") {
      event.preventDefault();
      capture(camera, env.setStatus);
    }
  },
};
