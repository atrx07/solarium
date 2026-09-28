import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

// Every apparent curve is born from two families of perfectly straight lines.
type Geometry = {
  name: string;
  pitch: number;
  pitchRatio: number;
  offsetAngle: number;
};

const geometries: Geometry[] = [
  { name: "VEIL", pitch: 8.5, pitchRatio: 1.035, offsetAngle: 0.045 },
  { name: "RIBBON", pitch: 6.8, pitchRatio: 1.11, offsetAngle: 0.027 },
  { name: "DRIFT", pitch: 10.4, pitchRatio: 0.96, offsetAngle: 0.085 },
  { name: "TREMOR", pitch: 5.9, pitchRatio: 1.065, offsetAngle: -0.065 },
  { name: "HALO", pitch: 9.2, pitchRatio: 1.19, offsetAngle: 0.014 },
];

let geometryIndex = 0;
let time = 0;
let frozen = false;
let pointerU = 0.5;
let pointerV = 0.5;

function reset(): void {
  geometryIndex = 0;
  time = 0;
  frozen = false;
  pointerU = 0.5;
  pointerV = 0.5;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  reach: number,
  pitch: number,
  angle: number,
  phase: number,
  color: string,
): void {
  ctx.save();
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  // Hard cap avoids unbounded geometry cost on large/high-density displays.
  const count = Math.min(190, Math.ceil(reach / pitch) + 2);
  ctx.beginPath();
  for (let line = -count; line <= count; line += 1) {
    const y = line * pitch + phase;
    ctx.moveTo(-reach, y);
    ctx.lineTo(reach, y);
  }
  ctx.stroke();
  ctx.restore();
}

export const moireRoom: RoomModule = {
  id: "moire",
  title: "XI · Moiré",
  copy: "Two fields of straight lines. Your eyes insist they see curves.",
  hint: "move to bend interference · click changes geometry · Space freezes · R restores",

  enter({ setStatus }): void {
    setStatus("moire / two fields · zero curved lines");
  },

  draw({ stage }, dt): void {
    if (!frozen) {
      time += Math.min(dt, 32) / 1000;
      if (stage.pointer.active) {
        pointerU = clamp(stage.pointer.x / Math.max(stage.width, 1), 0, 1);
        pointerV = clamp(stage.pointer.y / Math.max(stage.height, 1), 0, 1);
      }
    }

    stage.clear("#04060d");
    stage.drawStars(0.13);

    const { ctx, width, height } = stage;
    const cx = width * 0.5;
    const cy = height * 0.51;
    const radius = Math.min(width * 0.435, height * 0.385);
    const rx = radius * 1.23;
    const ry = radius;
    const reach = Math.hypot(rx, ry) * 2.5;
    const geometry = geometries[geometryIndex];

    // A tiny angular and spacing disagreement creates the large phantom bands.
    const u = pointerU * 2 - 1;
    const v = pointerV * 2 - 1;
    const angleA = -0.11 + Math.sin(time * 0.12) * 0.006;
    const angleB =
      angleA + geometry.offsetAngle + u * 0.068 +
      Math.cos(time * 0.19) * 0.006;
    const pitchA = geometry.pitch;
    const pitchB = Math.max(
      4.6,
      geometry.pitch * (geometry.pitchRatio + v * 0.13),
    );

    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "#0a1020";
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

    // Both passes contain only straight segments. No precomputed image,
    // curved grid, remote asset, or waveform texture is involved.
    drawLines(
      ctx, reach, pitchA, angleA,
      Math.sin(time * 0.13) * pitchA * 0.65,
      "rgba(151,195,255,0.57)",
    );
    ctx.globalCompositeOperation = "screen";
    drawLines(
      ctx, reach, pitchB, angleB,
      Math.cos(time * 0.17) * pitchB * 0.72 + u * 3,
      "rgba(255,203,181,0.57)",
    );
    ctx.restore();

    // Subtle field envelope, drawn after restoring the clip/transform.
    ctx.save();
    const halo = ctx.createRadialGradient(
      cx, cy, radius * 0.4, cx, cy, radius * 1.38,
    );
    halo.addColorStop(0, "rgba(5,8,17,0)");
    halo.addColorStop(1, "rgba(5,8,17,0.75)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(193,206,247,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 1, ry + 1, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(170,186,240,0.09)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 10, ry + 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "left";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(226,235,255,0.45)";
    ctx.fillText(
      geometry.name + " / Δ " + ((angleB - angleA) * 180 / Math.PI).toFixed(2) +
      "° / " + pitchB.toFixed(2) + " px" + (frozen ? " / FROZEN" : ""),
      28,
      height - 74,
    );
  },

  click(env): void {
    geometryIndex = (geometryIndex + 1) % geometries.length;
    env.setStatus(
      "moire / " + geometries[geometryIndex].name.toLowerCase() + " geometry",
    );
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("moire / original fields restored");
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      frozen = !frozen;
      env.setStatus(frozen ? "moire / pattern frozen" : "moire / pattern awake");
    }
  },
};
