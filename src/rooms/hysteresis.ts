import type { RoomModule } from "../core/room";
import { clamp } from "../core/stage";

type Domain = {
  up: number;
  down: number;
  state: 1 | -1;
  flash: number;
};

type TracePoint = {
  field: number;
  magnetization: number;
};

const COLS = 34;
const ROWS = 22;
const FIELD_MIN = -1;
const FIELD_MAX = 1;
const TRACE_LIMIT = 420;

let domains: Domain[] = [];
let trace: TracePoint[] = [];
let seedOffset = 0;
let drive = 0;
let zeroHoldX: number | null = null;

function hash01(x: number, y: number, seed: number): number {
  const n =
    Math.sin((x + 1) * 91.173 + (y + 1) * 17.731 + seed * 63.417) *
    43758.5453123;
  return n - Math.floor(n);
}

function magnetization(): number {
  if (domains.length === 0) return 0;
  let sum = 0;
  for (const domain of domains) sum += domain.state;
  return sum / domains.length;
}

function reset(seed = 0): void {
  seedOffset = seed;
  drive = 0;
  zeroHoldX = null;

  domains = Array.from({ length: COLS * ROWS }, (_, index) => {
    const x = index % COLS;
    const y = Math.floor(index / COLS);
    const bias = (hash01(x, y, seed * 3 + 1) - 0.5) * 0.42;
    const coercivity = 0.16 + hash01(x, y, seed * 3 + 2) * 0.46;
    const initial: 1 | -1 =
      hash01(x, y, seed * 3 + 3) >= 0.5 ? 1 : -1;

    return {
      up: clamp(bias + coercivity, FIELD_MIN, FIELD_MAX),
      down: clamp(bias - coercivity, FIELD_MIN, FIELD_MAX),
      state: initial,
      flash: 0,
    };
  });

  applyField(drive);
  trace = [{ field: drive, magnetization: magnetization() }];
}

function applyField(field: number): number {
  let switched = 0;

  for (const domain of domains) {
    if (domain.state < 0 && field >= domain.up) {
      domain.state = 1;
      domain.flash = 1;
      switched += 1;
    } else if (domain.state > 0 && field <= domain.down) {
      domain.state = -1;
      domain.flash = 1;
      switched += 1;
    }
  }

  return switched;
}

function recordTrace(force = false): void {
  const point = {
    field: drive,
    magnetization: magnetization(),
  };
  const last = trace[trace.length - 1];

  if (
    force ||
    !last ||
    Math.abs(point.field - last.field) > 0.008 ||
    Math.abs(point.magnetization - last.magnetization) > 0.008
  ) {
    trace.push(point);
    if (trace.length > TRACE_LIMIT) trace.shift();
  }
}

function fieldFromPointer(width: number, x: number): number {
  const u = clamp(x / Math.max(width, 1), 0, 1);
  return FIELD_MIN + u * (FIELD_MAX - FIELD_MIN);
}

function drawTrace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save();

  ctx.strokeStyle = "rgba(220,232,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.5);
  ctx.lineTo(x + width, y + height * 0.5);
  ctx.moveTo(x + width * 0.5, y);
  ctx.lineTo(x + width * 0.5, y + height);
  ctx.stroke();

  if (trace.length > 1) {
    ctx.strokeStyle = "rgba(224,230,255,0.38)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    trace.forEach((point, index) => {
      const px =
        x + ((point.field - FIELD_MIN) / (FIELD_MAX - FIELD_MIN)) * width;
      const py = y + (1 - (point.magnetization + 1) * 0.5) * height;

      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.stroke();
  }

  const currentX =
    x + ((drive - FIELD_MIN) / (FIELD_MAX - FIELD_MIN)) * width;
  const currentY = y + (1 - (magnetization() + 1) * 0.5) * height;

  ctx.fillStyle = "rgba(255,238,196,0.9)";
  ctx.beginPath();
  ctx.arc(currentX, currentY, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(232,240,255,0.28)";
  ctx.textAlign = "left";
  ctx.fillText("H", x + width + 8, y + height * 0.5 + 3);
  ctx.fillText("M", x + width * 0.5 + 6, y + 9);

  ctx.restore();
}

if (domains.length === 0) reset();

export const hysteresisRoom: RoomModule = {
  id: "hysteresis",
  title: "XVI · Hysteresis",
  copy: "Return to the same input. The room remembers how you arrived.",
  hint:
    "move left/right to drive field · click changes material · Space removes field · R restores",

  enter({ setStatus }): void {
    setStatus("hysteresis / path matters");
  },

  draw({ stage }, dt): void {
    const { ctx, width, height } = stage;

    if (
      zeroHoldX !== null &&
      stage.pointer.active &&
      Math.abs(stage.pointer.x - zeroHoldX) > 2
    ) {
      zeroHoldX = null;
    }

    if (stage.pointer.active && zeroHoldX === null) {
      const nextDrive = fieldFromPointer(width, stage.pointer.x);
      if (Math.abs(nextDrive - drive) > 0.0005) {
        drive = nextDrive;
        const switched = applyField(drive);
        recordTrace(switched > 0);
      }
    }

    const fade = Math.exp(-Math.min(dt, 32) / 170);
    for (const domain of domains) domain.flash *= fade;

    stage.clear("#03050a");
    stage.drawStars(0.06);

    const marginX = Math.max(26, width * 0.07);
    const top = Math.max(86, height * 0.135);
    const traceHeight = Math.min(96, height * 0.13);
    const bottomReserve = Math.max(138, height * 0.19);
    const fieldWidth = width - marginX * 2;
    const fieldHeight = height - top - bottomReserve;
    const cellW = fieldWidth / COLS;
    const cellH = fieldHeight / ROWS;
    const needle = Math.min(cellW, cellH) * 0.34;

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const domain = domains[y * COLS + x];
        const cx = marginX + (x + 0.5) * cellW;
        const cy = top + (y + 0.5) * cellH;
        const angle = domain.state > 0 ? -Math.PI * 0.25 : Math.PI * 0.25;
        const dx = Math.cos(angle) * needle;
        const dy = Math.sin(angle) * needle;
        const flashBoost = domain.flash * 0.55;

        ctx.strokeStyle =
          domain.state > 0
            ? `rgba(255,210,168,${0.34 + flashBoost})`
            : `rgba(167,205,255,${0.31 + flashBoost})`;
        ctx.lineWidth = 1 + domain.flash * 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - dx, cy - dy);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.stroke();

        if (domain.flash > 0.05) {
          ctx.fillStyle =
            domain.state > 0
              ? `rgba(255,220,185,${domain.flash * 0.09})`
              : `rgba(180,218,255,${domain.flash * 0.09})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 3 + domain.flash * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const zeroX = marginX + fieldWidth * 0.5;
    const driveX =
      marginX +
      ((drive - FIELD_MIN) / (FIELD_MAX - FIELD_MIN)) * fieldWidth;

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zeroX, top - 10);
    ctx.lineTo(zeroX, top + fieldHeight + 10);
    ctx.stroke();

    ctx.strokeStyle =
      drive >= 0
        ? "rgba(255,217,177,0.34)"
        : "rgba(176,211,255,0.34)";
    ctx.beginPath();
    ctx.moveTo(driveX, top - 16);
    ctx.lineTo(driveX, top - 4);
    ctx.stroke();

    const traceWidth = Math.min(fieldWidth * 0.38, 300);
    const traceX = marginX;
    const traceY = height - traceHeight - 58;
    drawTrace(ctx, traceX, traceY, traceWidth, traceHeight);

    const m = magnetization();
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(232,240,255,0.44)";
    ctx.fillText(
      `FIELD ${drive >= 0 ? "+" : ""}${drive.toFixed(3)} / MEMORY ${m >= 0 ? "+" : ""}${m.toFixed(3)}`,
      width - marginX,
      height - 78,
    );

    ctx.fillStyle =
      Math.abs(drive) < 0.025 && Math.abs(m) > 0.08
        ? "rgba(255,239,194,0.82)"
        : "rgba(232,240,255,0.34)";
    ctx.font =
      "500 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(
      Math.abs(drive) < 0.025 && Math.abs(m) > 0.08
        ? "The field is gone. The bias remained."
        : "The same field can lead to more than one state.",
      width - marginX,
      height - 48,
    );
  },

  click({ setStatus }): void {
    reset(seedOffset + 1);
    setStatus("hysteresis / material changed");
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset(0);
      env.setStatus("hysteresis / canonical material restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      drive = 0;
      zeroHoldX = env.stage.pointer.active ? env.stage.pointer.x : null;
      const switched = applyField(drive);
      recordTrace(true);
      env.setStatus(
        switched > 0
          ? "hysteresis / field removed · domains relaxed"
          : "hysteresis / field removed · memory remained",
      );
    }
  },
};
