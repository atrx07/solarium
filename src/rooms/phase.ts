import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Oscillator = {
  phase: number;
  frequency: number;
  u: number;
  v: number;
  ring: number;
};

const COUNT = 72;
const BASE_COUPLING = 1.15;
const HOLD_COUPLING = 3.4;

let oscillators: Oscillator[] = [];
let paused = false;
let elapsed = 0;

function wrapAngle(value: number): number {
  return ((value % TAU) + TAU) % TAU;
}

function seed(): void {
  oscillators = Array.from({ length: COUNT }, (_, index) => {
    const ring = index % 3;
    const slot = Math.floor(index / 3);
    const slots = COUNT / 3;
    const angle = (slot / slots) * TAU + ring * 0.21;
    const radius = 0.19 + ring * 0.105;

    return {
      phase: wrapAngle(index * 2.399963229728653 + ring * 0.47),
      frequency:
        0.83 +
        0.22 * Math.sin(index * 1.731 + ring * 0.8) +
        0.07 * Math.cos(index * 0.417),
      u: 0.5 + Math.cos(angle) * radius,
      v: 0.52 + Math.sin(angle) * radius * 0.78,
      ring,
    };
  });

  paused = false;
  elapsed = 0;
}

function orderParameter(): {
  coherence: number;
  phase: number;
} {
  let x = 0;
  let y = 0;

  for (const oscillator of oscillators) {
    x += Math.cos(oscillator.phase);
    y += Math.sin(oscillator.phase);
  }

  x /= Math.max(oscillators.length, 1);
  y /= Math.max(oscillators.length, 1);

  return {
    coherence: Math.hypot(x, y),
    phase: Math.atan2(y, x),
  };
}

function evolve(
  dtSeconds: number,
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  pointerActive: boolean,
  pointerDown: boolean,
): void {
  if (paused || oscillators.length === 0) return;

  const order = orderParameter();
  const coupling = pointerDown ? HOLD_COUPLING : BASE_COUPLING;
  const cx = width * 0.5;
  const cy = height * 0.52;

  // Pointer phase advances like a local metronome. Its geometric bearing adds
  // a small visitor-controlled offset so movement changes what it asks nearby
  // oscillators to agree with.
  const pointerBearing = Math.atan2(pointerY - cy, pointerX - cx);
  const pointerPhase = elapsed * 1.9 + pointerBearing;

  const derivatives = oscillators.map((oscillator) => {
    let derivative =
      oscillator.frequency +
      coupling *
        order.coherence *
        Math.sin(order.phase - oscillator.phase);

    if (pointerActive) {
      const x = oscillator.u * width;
      const y = oscillator.v * height;
      const distance = Math.hypot(x - pointerX, y - pointerY);
      const reach = Math.min(width, height) * 0.27;
      const influence = clamp(1 - distance / Math.max(reach, 1), 0, 1);

      derivative +=
        influence *
        (pointerDown ? 4.2 : 2.05) *
        Math.sin(pointerPhase - oscillator.phase);
    }

    return derivative;
  });

  for (let index = 0; index < oscillators.length; index += 1) {
    oscillators[index].phase = wrapAngle(
      oscillators[index].phase + derivatives[index] * dtSeconds,
    );
  }
}

function phaseColor(phase: number, alpha: number): string {
  const hue = 195 + Math.sin(phase) * 36 + Math.cos(phase * 0.5) * 10;
  return `hsla(${hue.toFixed(1)}, 82%, 73%, ${alpha})`;
}

function shock(width: number, height: number, x: number, y: number): void {
  const span = Math.max(Math.min(width, height) * 0.58, 1);

  for (const oscillator of oscillators) {
    const ox = oscillator.u * width;
    const oy = oscillator.v * height;
    const distance = Math.hypot(ox - x, oy - y);
    const wave = clamp(1 - distance / span, 0, 1);

    oscillator.phase = wrapAngle(
      oscillator.phase +
        Math.sin(distance * 0.028 + oscillator.ring * 0.9) *
          (0.55 + wave * 2.45),
    );
  }
}

if (oscillators.length === 0) seed();

export const phaseRoom: RoomModule = {
  id: "phase",
  title: "XII · Phase",
  copy: "Seventy-two clocks disagree until agreement becomes a force.",
  hint:
    "move to locally entrain · hold strengthens coupling · click sends phase shock · Space pauses · R resets",

  enter({ setStatus }): void {
    setStatus("phase / clocks disagreeing");
  },

  draw({ stage }, dt): void {
    const dtSeconds = Math.min(dt, 32) / 1000;
    if (!paused) elapsed += dtSeconds;

    evolve(
      dtSeconds,
      stage.width,
      stage.height,
      stage.pointer.x,
      stage.pointer.y,
      stage.pointer.active,
      stage.pointer.down,
    );

    const order = orderParameter();
    const { ctx, width, height } = stage;
    const cx = width * 0.5;
    const cy = height * 0.52;
    const scale = Math.min(width, height);

    stage.clear("#03050b");
    stage.drawStars(0.11);

    const haloRadius = 44 + order.coherence * 118;
    stage.glow(
      cx,
      cy,
      haloRadius,
      `rgba(165, 217, 255, ${0.08 + order.coherence * 0.16})`,
      "rgba(85, 118, 190, 0)",
    );

    // Mean phase is drawn as a single collective hand in the middle.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(220,235,255,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, TAU);
    ctx.stroke();

    ctx.rotate(order.phase);
    ctx.strokeStyle = phaseColor(order.phase, 0.82);
    ctx.lineWidth = 1.5 + order.coherence * 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(23 + order.coherence * 18, 0);
    ctx.stroke();

    ctx.fillStyle = phaseColor(order.phase, 0.94);
    ctx.beginPath();
    ctx.arc(23 + order.coherence * 18, 0, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();

    for (const oscillator of oscillators) {
      const x = oscillator.u * width;
      const y = oscillator.v * height;
      const handLength = 8 + oscillator.ring * 1.8;
      const hx = x + Math.cos(oscillator.phase) * handLength;
      const hy = y + Math.sin(oscillator.phase) * handLength;

      ctx.strokeStyle = phaseColor(oscillator.phase, 0.36);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      ctx.fillStyle = phaseColor(oscillator.phase, 0.72);
      ctx.beginPath();
      ctx.arc(hx, hy, 1.8, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = "rgba(225,235,255,0.09)";
      ctx.beginPath();
      ctx.arc(x, y, handLength + 2.5, 0, TAU);
      ctx.stroke();
    }

    if (stage.pointer.active) {
      const pointerPhase =
        elapsed * 1.9 +
        Math.atan2(stage.pointer.y - cy, stage.pointer.x - cx);
      const pulse = 10 + Math.sin(pointerPhase) * 2.5;

      ctx.strokeStyle = stage.pointer.down
        ? "rgba(255,240,196,0.75)"
        : "rgba(220,235,255,0.38)";
      ctx.lineWidth = stage.pointer.down ? 1.6 : 1;
      ctx.beginPath();
      ctx.arc(stage.pointer.x, stage.pointer.y, pulse, 0, TAU);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(stage.pointer.x, stage.pointer.y);
      ctx.lineTo(
        stage.pointer.x + Math.cos(pointerPhase) * 18,
        stage.pointer.y + Math.sin(pointerPhase) * 18,
      );
      ctx.stroke();
    }

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(235,242,255,0.48)";
    ctx.fillText(
      `COHERENCE ${(order.coherence * 100).toFixed(1)}% / ${stage.pointer.down ? "STRONG COUPLING" : "NATURAL COUPLING"}${paused ? " / FROZEN" : ""}`,
      28,
      height - 74,
    );

    // Small bars make the global order parameter readable without becoming UI.
    const barWidth = Math.min(180, scale * 0.27);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(28, height - 60, barWidth, 2);
    ctx.fillStyle = phaseColor(order.phase, 0.72);
    ctx.fillRect(28, height - 60, barWidth * order.coherence, 2);
  },

  click({ stage, setStatus }, x, y): void {
    shock(stage.width, stage.height, x, y);
    setStatus("phase / agreement disturbed");
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      seed();
      env.setStatus("phase / clocks reseeded");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "phase / clocks frozen" : "phase / clocks awake");
    }
  },
};
