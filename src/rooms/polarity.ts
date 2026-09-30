import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Charge = {
  u: number;
  v: number;
  sign: 1 | -1;
};

type Vector = {
  x: number;
  y: number;
  magnitude: number;
};

const MAX_CHARGES = 10;
const SOFTENING = 0.018;
const GRID_STEP = 46;

let charges: Charge[] = [];
let nextSign: 1 | -1 = 1;
let frozen = false;
let visualTime = 0;

function reset(): void {
  charges = [
    { u: 0.37, v: 0.5, sign: 1 },
    { u: 0.63, v: 0.5, sign: -1 },
  ];
  nextSign = 1;
  frozen = false;
  visualTime = 0;
}

function fieldAt(
  width: number,
  height: number,
  x: number,
  y: number,
): Vector {
  let fx = 0;
  let fy = 0;
  const scale = Math.max(Math.min(width, height), 1);

  for (const charge of charges) {
    const cx = charge.u * width;
    const cy = charge.v * height;
    const dx = (x - cx) / scale;
    const dy = (y - cy) / scale;
    const r2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
    const invR3 = 1 / Math.pow(r2, 1.5);

    fx += charge.sign * dx * invR3;
    fy += charge.sign * dy * invR3;
  }

  const magnitude = Math.hypot(fx, fy);
  return { x: fx, y: fy, magnitude };
}

function nearestCharge(
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  let nearest = -1;
  let best = 30;

  charges.forEach((charge, index) => {
    const cx = charge.u * width;
    const cy = charge.v * height;
    const distance = Math.hypot(cx - x, cy - y);

    if (distance < best) {
      best = distance;
      nearest = index;
    }
  });

  return nearest;
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vector: Vector,
): void {
  if (vector.magnitude < 0.0001) return;

  const angle = Math.atan2(vector.y, vector.x);
  const normalized = clamp(Math.log10(vector.magnitude + 1) / 2.2, 0.18, 1);
  const length = 8 + normalized * 11;
  const alpha = 0.11 + normalized * 0.28;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = `rgba(199,220,255,${alpha})`;
  ctx.fillStyle = `rgba(199,220,255,${alpha})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-length * 0.45, 0);
  ctx.lineTo(length * 0.45, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(length * 0.45, 0);
  ctx.lineTo(length * 0.22, -2.5);
  ctx.lineTo(length * 0.22, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCharge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  charge: Charge,
  time: number,
): void {
  const x = charge.u * width;
  const y = charge.v * height;
  const pulse = 1 + Math.sin(time * 0.002 + x * 0.01) * 0.08;
  const radius = 12 * pulse;

  ctx.save();

  const halo = ctx.createRadialGradient(x, y, 0, x, y, 38);
  if (charge.sign > 0) {
    halo.addColorStop(0, "rgba(255,195,155,0.28)");
    halo.addColorStop(1, "rgba(255,195,155,0)");
  } else {
    halo.addColorStop(0, "rgba(145,197,255,0.28)");
    halo.addColorStop(1, "rgba(145,197,255,0)");
  }
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, TAU);
  ctx.fill();

  ctx.strokeStyle =
    charge.sign > 0
      ? "rgba(255,214,183,0.86)"
      : "rgba(180,218,255,0.86)";
  ctx.fillStyle =
    charge.sign > 0
      ? "rgba(255,189,143,0.22)"
      : "rgba(134,187,255,0.22)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle =
    charge.sign > 0 ? "rgba(255,235,219,0.94)" : "rgba(225,241,255,0.94)";
  ctx.fillText(charge.sign > 0 ? "+" : "−", x, y + 0.5);
  ctx.restore();
}

function drawProbe(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  x: number,
  y: number,
  down: boolean,
): void {
  const vector = fieldAt(width, height, x, y);
  const angle = Math.atan2(vector.y, vector.x);
  const normalized = clamp(Math.log10(vector.magnitude + 1) / 2, 0, 1);
  const length = 26 + normalized * 38;

  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = down
    ? "rgba(255,241,190,0.84)"
    : "rgba(238,245,255,0.72)";
  ctx.lineWidth = down ? 1.8 : 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.stroke();

  if (vector.magnitude > 0.0001) {
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(length - 7, -4);
    ctx.lineTo(length - 7, 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

if (charges.length === 0) reset();

export const polarityRoom: RoomModule = {
  id: "polarity",
  title: "XIII · Polarity",
  copy: "Put opposite signs in the dark. The empty space between them stops being empty.",
  hint:
    "click empty space to add · click a charge to flip sign · pointer probes force · C clears · R resets",

  enter({ setStatus }): void {
    setStatus("polarity / dipole awake");
  },

  draw({ stage }, dt): void {
    if (!frozen) visualTime += Math.min(dt, 32);

    const { ctx, width, height } = stage;
    stage.clear("#03060d");
    stage.drawStars(0.1);

    const offset = GRID_STEP * 0.5;
    for (let y = offset; y < height; y += GRID_STEP) {
      for (let x = offset; x < width; x += GRID_STEP) {
        drawArrow(ctx, x, y, fieldAt(width, height, x, y));
      }
    }

    // Draw faint equipotential-like contour bands from the signed scalar sum.
    ctx.save();
    ctx.globalAlpha = 0.1;
    const bandStep = 24;
    for (let y = bandStep * 0.5; y < height; y += bandStep) {
      for (let x = bandStep * 0.5; x < width; x += bandStep) {
        let potential = 0;
        const scale = Math.max(Math.min(width, height), 1);

        for (const charge of charges) {
          const dx = (x - charge.u * width) / scale;
          const dy = (y - charge.v * height) / scale;
          const r = Math.sqrt(dx * dx + dy * dy + SOFTENING * SOFTENING);
          potential += charge.sign / r;
        }

        const strength = clamp(Math.abs(potential) / 10, 0, 1);
        if (strength < 0.12) continue;

        ctx.fillStyle =
          potential >= 0
            ? `rgba(255,188,145,${0.08 + strength * 0.18})`
            : `rgba(140,194,255,${0.08 + strength * 0.18})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    ctx.restore();

    charges.forEach((charge) =>
      drawCharge(ctx, width, height, charge, visualTime),
    );

    if (stage.pointer.active) {
      drawProbe(
        ctx,
        width,
        height,
        stage.pointer.x,
        stage.pointer.y,
        stage.pointer.down,
      );
    }

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(232,240,255,0.5)";

    const positive = charges.filter((charge) => charge.sign > 0).length;
    const negative = charges.length - positive;
    ctx.fillText(
      `${charges.length} CHARGES / +${positive} −${negative} / NEXT ${nextSign > 0 ? "+" : "−"}${frozen ? " / FROZEN" : ""}`,
      28,
      height - 74,
    );
  },

  click({ stage, setStatus }, x, y): void {
    const nearby = nearestCharge(stage.width, stage.height, x, y);

    if (nearby >= 0) {
      charges[nearby].sign = charges[nearby].sign > 0 ? -1 : 1;
      setStatus("polarity / charge flipped");
      return;
    }

    if (charges.length >= MAX_CHARGES) {
      setStatus("polarity / ten charges · flip or clear");
      return;
    }

    charges.push({
      u: clamp(x / Math.max(stage.width, 1), 0.06, 0.94),
      v: clamp(y / Math.max(stage.height, 1), 0.14, 0.86),
      sign: nextSign,
    });
    nextSign = nextSign > 0 ? -1 : 1;
    setStatus("polarity / charge added");
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("polarity / dipole restored");
      return;
    }

    if (event.key.toLowerCase() === "c") {
      charges = [];
      nextSign = 1;
      env.setStatus("polarity / field cleared");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      frozen = !frozen;
      env.setStatus(frozen ? "polarity / pulses frozen" : "polarity / pulses awake");
    }
  },
};
