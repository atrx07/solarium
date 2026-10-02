import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Sample = {
  phase: number;
  time: number;
};

const SPOKES = 12;
const MIN_SPIN_HZ = 0.25;
const MAX_SPIN_HZ = 7.5;
const MIN_SAMPLE_HZ = 3;
const MAX_SAMPLE_HZ = 30;
const SAMPLE_HISTORY = 9;

let truePhase = 0;
let sampledPhase = 0;
let previousSamplePhase = 0;
let spinHz = 4.4;
let sampleHz = 12;
let sampleClock = 0;
let elapsed = 0;
let paused = false;
let controlsLocked = false;
let samples: Sample[] = [];

function reset(): void {
  truePhase = 0;
  sampledPhase = 0;
  previousSamplePhase = 0;
  spinHz = 4.4;
  sampleHz = 12;
  sampleClock = 0;
  elapsed = 0;
  paused = false;
  controlsLocked = false;
  samples = [];
}

function updateControls(width: number, height: number, x: number, y: number): void {
  if (controlsLocked) return;

  const u = clamp(x / Math.max(width, 1), 0, 1);
  const v = clamp(y / Math.max(height, 1), 0, 1);

  spinHz = MIN_SPIN_HZ + u * (MAX_SPIN_HZ - MIN_SPIN_HZ);
  sampleHz = MAX_SAMPLE_HZ - v * (MAX_SAMPLE_HZ - MIN_SAMPLE_HZ);
}

function wrapSigned(value: number, period: number): number {
  let wrapped = ((value + period / 2) % period + period) % period - period / 2;
  if (wrapped === -period / 2) wrapped = period / 2;
  return wrapped;
}

function apparentSpinHz(): number {
  const spokePeriod = TAU / SPOKES;
  const delta = wrapSigned(sampledPhase - previousSamplePhase, spokePeriod);
  return (delta / TAU) * sampleHz;
}

function takeSample(): void {
  previousSamplePhase = sampledPhase;
  sampledPhase = truePhase;
  samples.push({ phase: sampledPhase, time: elapsed });
  if (samples.length > SAMPLE_HISTORY) samples.shift();
}

function simulate(dtSeconds: number): void {
  if (paused) return;

  truePhase += TAU * spinHz * dtSeconds;
  elapsed += dtSeconds;
  sampleClock += dtSeconds;

  const period = 1 / sampleHz;
  while (sampleClock >= period) {
    sampleClock -= period;
    takeSample();
  }
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  phase: number,
  alpha: number,
  emphasized = false,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(phase);

  ctx.strokeStyle = emphasized
    ? `rgba(255,232,193,${alpha})`
    : `rgba(194,219,255,${alpha})`;
  ctx.lineWidth = emphasized ? 1.5 : 1;

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();

  for (let index = 0; index < SPOKES; index += 1) {
    const angle = (index / SPOKES) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.08, Math.sin(angle) * radius * 0.08);
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.stroke();
  }

  ctx.fillStyle = emphasized
    ? `rgba(255,239,210,${Math.min(1, alpha + 0.12)})`
    : `rgba(218,233,255,${Math.min(1, alpha + 0.08)})`;
  ctx.beginPath();
  ctx.arc(0, 0, emphasized ? 4.2 : 3.3, 0, TAU);
  ctx.fill();

  ctx.restore();
}

function drawSampleHistory(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  const count = samples.length;
  if (count === 0) return;

  for (let index = 0; index < count; index += 1) {
    const sample = samples[index];
    const age = count - 1 - index;
    const alpha = 0.035 + (1 - age / Math.max(1, SAMPLE_HISTORY)) * 0.07;
    drawWheel(ctx, cx, cy, radius, sample.phase, alpha, false);
  }
}

function directionLabel(value: number): string {
  if (Math.abs(value) < 0.035) return "APPARENTLY STILL";
  return value > 0 ? "APPARENTLY FORWARD" : "APPARENTLY BACKWARD";
}

function drawScale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const left = Math.max(28, width * 0.08);
  const right = width - left;
  const y = height - 58;
  const spinU = (spinHz - MIN_SPIN_HZ) / (MAX_SPIN_HZ - MIN_SPIN_HZ);
  const sampleU = (sampleHz - MIN_SAMPLE_HZ) / (MAX_SAMPLE_HZ - MIN_SAMPLE_HZ);

  ctx.save();
  ctx.lineWidth = 1;

  ctx.strokeStyle = "rgba(232,240,255,0.09)";
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  const spinX = left + spinU * (right - left);
  const sampleX = left + sampleU * (right - left);

  ctx.fillStyle = "rgba(255,224,181,0.84)";
  ctx.beginPath();
  ctx.arc(spinX, y, 3.5, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "rgba(184,215,255,0.78)";
  ctx.beginPath();
  ctx.arc(sampleX, y, 3.5, 0, TAU);
  ctx.fill();

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,224,181,0.34)";
  ctx.fillText("SPIN", left, y - 12);
  ctx.fillStyle = "rgba(184,215,255,0.34)";
  ctx.fillText("SAMPLE", left + 54, y - 12);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(232,240,255,0.22)";
  ctx.fillText(controlsLocked ? "CONTROLS LOCKED" : "MOVE TO TUNE", right, y - 12);

  ctx.restore();
}

if (samples.length === 0) takeSample();

export const aliasRoom: RoomModule = {
  id: "alias",
  title: "XXII · Alias",
  copy: "The wheel never reverses. The samples can swear that it did.",
  hint:
    "move horizontally for spin · vertically for sample rate · click locks controls · Space pause · R restore",

  enter({ setStatus }): void {
    setStatus("alias / continuous world · discrete witness");
  },

  draw({ stage }, dt): void {
    if (stage.pointer.active && !stage.pointer.down) {
      updateControls(
        stage.width,
        stage.height,
        stage.pointer.x,
        stage.pointer.y,
      );
    }

    simulate(Math.min(dt, 32) / 1000);

    const { ctx, width, height } = stage;
    stage.clear("#03050a");
    stage.drawStars(0.035);

    const mobile = width < 680;
    const radius = Math.min(
      width * (mobile ? 0.26 : 0.16),
      height * (mobile ? 0.14 : 0.21),
    );
    const worldX = mobile ? width * 0.5 : width * 0.31;
    const cameraX = mobile ? width * 0.5 : width * 0.69;
    const worldY = mobile ? height * 0.34 : height * 0.47;
    const cameraY = mobile ? height * 0.65 : height * 0.47;

    drawWheel(
      ctx,
      worldX,
      worldY,
      radius,
      truePhase,
      0.48,
      false,
    );

    drawSampleHistory(ctx, cameraX, cameraY, radius);
    drawWheel(
      ctx,
      cameraX,
      cameraY,
      radius,
      sampledPhase,
      0.82,
      true,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(206,226,255,0.3)";
    ctx.fillText("CONTINUOUS", worldX, worldY - radius - 20);
    ctx.fillStyle = "rgba(255,225,184,0.42)";
    ctx.fillText("SAMPLED", cameraX, cameraY - radius - 20);

    if (!mobile) {
      ctx.strokeStyle = "rgba(232,240,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.26);
      ctx.lineTo(width * 0.5, height * 0.68);
      ctx.stroke();
    }

    const apparent = apparentSpinHz();
    const messageY = mobile
      ? Math.min(height - 105, cameraY + radius + 54)
      : Math.min(height - 105, height * 0.73);

    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle =
      apparent < -0.035
        ? "rgba(255,221,177,0.82)"
        : "rgba(232,240,255,0.5)";
    ctx.fillText(
      apparent < -0.035
        ? "Nothing reversed. The witness missed the turns."
        : Math.abs(apparent) < 0.035
          ? "The wheel is moving. The samples keep landing together."
          : "The sampled wheel still agrees with the world.",
      width / 2,
      messageY,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.25)";
    ctx.fillText(
      `TRUE +${spinHz.toFixed(2)} Hz · SAMPLE ${sampleHz.toFixed(1)} Hz · SEEN ${apparent >= 0 ? "+" : ""}${apparent.toFixed(2)} Hz · ${directionLabel(apparent)}${paused ? " · PAUSED" : ""}`,
      width / 2,
      messageY + 24,
    );

    drawScale(ctx, width, height);
  },

  click({ setStatus }): void {
    controlsLocked = !controlsLocked;
    setStatus(
      controlsLocked
        ? "alias / controls locked"
        : "alias / pointer control restored",
    );
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      takeSample();
      env.setStatus("alias / canonical observation restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "alias / paused" : "alias / moving");
    }
  },
};
