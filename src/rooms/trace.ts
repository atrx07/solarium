import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Agent = {
  x: number;
  y: number;
  angle: number;
  carrying: boolean;
  seed: number;
};

type Source = {
  x: number;
  y: number;
};

const GRID_W = 84;
const GRID_H = 52;
const AGENT_COUNT = 120;
const MAX_SOURCES = 5;

const NEST: Source = { x: 0.28, y: 0.52 };
const CANONICAL_SOURCES: Source[] = [
  { x: 0.73, y: 0.28 },
  { x: 0.78, y: 0.7 },
  { x: 0.62, y: 0.52 },
];

let agents: Agent[] = [];
let sources: Source[] = [];
let homeField = new Float32Array(GRID_W * GRID_H);
let foodField = new Float32Array(GRID_W * GRID_H);
let homeScratch = new Float32Array(GRID_W * GRID_H);
let foodScratch = new Float32Array(GRID_W * GRID_H);
let paused = false;
let tick = 0;

function hash01(index: number, salt: number): number {
  const n = Math.sin((index + 1) * 71.173 + (salt + 1) * 19.337) * 43758.5453;
  return n - Math.floor(n);
}

function reset(): void {
  paused = false;
  tick = 0;
  homeField.fill(0);
  foodField.fill(0);
  homeScratch.fill(0);
  foodScratch.fill(0);
  sources = CANONICAL_SOURCES.map((source) => ({ ...source }));

  agents = Array.from({ length: AGENT_COUNT }, (_, index) => {
    const angle = hash01(index, 3) * TAU;
    const radius = 0.012 + hash01(index, 7) * 0.038;

    return {
      x: NEST.x + Math.cos(angle) * radius,
      y: NEST.y + Math.sin(angle) * radius,
      angle,
      carrying: false,
      seed: hash01(index, 11) * TAU,
    };
  });
}

function indexOf(x: number, y: number): number {
  return y * GRID_W + x;
}

function sample(field: Float32Array, x: number, y: number): number {
  const gx = clamp(x, 0, 0.9999) * (GRID_W - 1);
  const gy = clamp(y, 0, 0.9999) * (GRID_H - 1);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(GRID_W - 1, x0 + 1);
  const y1 = Math.min(GRID_H - 1, y0 + 1);
  const tx = gx - x0;
  const ty = gy - y0;

  const a = field[indexOf(x0, y0)];
  const b = field[indexOf(x1, y0)];
  const c = field[indexOf(x0, y1)];
  const d = field[indexOf(x1, y1)];

  return (
    a * (1 - tx) * (1 - ty) +
    b * tx * (1 - ty) +
    c * (1 - tx) * ty +
    d * tx * ty
  );
}

function deposit(
  field: Float32Array,
  x: number,
  y: number,
  amount: number,
): void {
  const gx = Math.round(clamp(x, 0, 1) * (GRID_W - 1));
  const gy = Math.round(clamp(y, 0, 1) * (GRID_H - 1));

  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      const nx = gx + ox;
      const ny = gy + oy;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;

      const falloff = ox === 0 && oy === 0 ? 1 : ox === 0 || oy === 0 ? 0.44 : 0.2;
      const i = indexOf(nx, ny);
      field[i] = Math.min(1.25, field[i] + amount * falloff);
    }
  }
}

function diffuse(
  field: Float32Array,
  scratch: Float32Array,
  decay: number,
): void {
  for (let y = 0; y < GRID_H; y += 1) {
    for (let x = 0; x < GRID_W; x += 1) {
      const i = indexOf(x, y);
      const left = field[indexOf(Math.max(0, x - 1), y)];
      const right = field[indexOf(Math.min(GRID_W - 1, x + 1), y)];
      const up = field[indexOf(x, Math.max(0, y - 1))];
      const down = field[indexOf(x, Math.min(GRID_H - 1, y + 1))];
      const neighborhood = (left + right + up + down) * 0.25;
      scratch[i] = (field[i] * 0.945 + neighborhood * 0.055) * decay;
    }
  }
}

function swapFields(): void {
  let temp = homeField;
  homeField = homeScratch;
  homeScratch = temp;

  temp = foodField;
  foodField = foodScratch;
  foodScratch = temp;
}

function nearestSource(x: number, y: number): Source | undefined {
  let nearest: Source | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const source of sources) {
    const d = Math.hypot(source.x - x, source.y - y);
    if (d < nearestDistance) {
      nearest = source;
      nearestDistance = d;
    }
  }

  return nearestDistance <= 0.045 ? nearest : undefined;
}

function steerAgent(agent: Agent, time: number): void {
  const field = agent.carrying ? homeField : foodField;
  const sensorDistance = 0.026;
  const sensorAngle = 0.52;

  const sense = (offset: number): number => {
    const angle = agent.angle + offset;
    return sample(
      field,
      agent.x + Math.cos(angle) * sensorDistance,
      agent.y + Math.sin(angle) * sensorDistance,
    );
  };

  const forward = sense(0);
  const left = sense(-sensorAngle);
  const right = sense(sensorAngle);

  const noise =
    Math.sin(time * 0.0015 + agent.seed * 7.13 + tick * 0.011) * 0.09;

  if (Math.max(forward, left, right) < 0.015) {
    agent.angle +=
      Math.sin(time * 0.0008 + agent.seed * 3.7 + tick * 0.004) * 0.15 +
      noise;
  } else if (left > forward && left > right) {
    agent.angle -= 0.19 + noise;
  } else if (right > forward && right > left) {
    agent.angle += 0.19 + noise;
  } else {
    agent.angle += noise * 0.35;
  }
}

function simulate(dtSeconds: number, time: number): void {
  if (paused) return;

  const decay = Math.exp(-dtSeconds * 0.18);
  diffuse(homeField, homeScratch, decay);
  diffuse(foodField, foodScratch, decay);
  swapFields();

  for (const agent of agents) {
    steerAgent(agent, time);

    const speed = agent.carrying ? 0.082 : 0.075;
    agent.x += Math.cos(agent.angle) * speed * dtSeconds;
    agent.y += Math.sin(agent.angle) * speed * dtSeconds;

    if (agent.x < 0.025) {
      agent.x = 0.025;
      agent.angle = Math.PI - agent.angle;
    } else if (agent.x > 0.975) {
      agent.x = 0.975;
      agent.angle = Math.PI - agent.angle;
    }

    if (agent.y < 0.035) {
      agent.y = 0.035;
      agent.angle = -agent.angle;
    } else if (agent.y > 0.965) {
      agent.y = 0.965;
      agent.angle = -agent.angle;
    }

    if (agent.carrying) {
      deposit(foodField, agent.x, agent.y, 0.34 * dtSeconds);

      if (Math.hypot(agent.x - NEST.x, agent.y - NEST.y) < 0.045) {
        agent.carrying = false;
        agent.angle += Math.PI + (agent.seed - Math.PI) * 0.08;
      }
    } else {
      deposit(homeField, agent.x, agent.y, 0.28 * dtSeconds);

      const source = nearestSource(agent.x, agent.y);
      if (source) {
        agent.carrying = true;
        agent.angle += Math.PI + (agent.seed - Math.PI) * 0.08;
      }
    }
  }

  tick += 1;
}

function drawField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const cellW = width / GRID_W;
  const cellH = height / GRID_H;

  for (let y = 0; y < GRID_H; y += 1) {
    for (let x = 0; x < GRID_W; x += 1) {
      const i = indexOf(x, y);
      const home = clamp(homeField[i], 0, 1);
      const food = clamp(foodField[i], 0, 1);

      if (home < 0.018 && food < 0.018) continue;

      const px = x * cellW;
      const py = y * cellH;

      if (home > 0.018) {
        ctx.fillStyle = `rgba(128,183,255,${(home * 0.055).toFixed(4)})`;
        ctx.fillRect(px, py, cellW + 1, cellH + 1);
      }

      if (food > 0.018) {
        ctx.fillStyle = `rgba(255,186,112,${(food * 0.065).toFixed(4)})`;
        ctx.fillRect(px, py, cellW + 1, cellH + 1);
      }
    }
  }
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  agent: Agent,
): void {
  const x = agent.x * width;
  const y = agent.y * height;
  const scale = width < 680 ? 0.8 : width >= 1200 ? 1.05 : 0.92;
  const length = 5.4 * scale;
  const bodyWidth = 2.3 * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(agent.angle);

  ctx.fillStyle = agent.carrying
    ? "rgba(255,205,139,0.92)"
    : "rgba(205,224,255,0.82)";
  ctx.beginPath();
  ctx.ellipse(0, 0, length, bodyWidth, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = agent.carrying
    ? "rgba(255,240,194,0.8)"
    : "rgba(238,246,255,0.62)";
  ctx.beginPath();
  ctx.arc(length * 0.55, 0, bodyWidth * 0.7, 0, TAU);
  ctx.fill();

  ctx.restore();
}

function trailStats(): { active: number; carrying: number } {
  let active = 0;
  let carrying = 0;

  for (const value of homeField) {
    if (value > 0.08) active += 1;
  }
  for (const value of foodField) {
    if (value > 0.08) active += 1;
  }
  for (const agent of agents) {
    if (agent.carrying) carrying += 1;
  }

  return { active, carrying };
}

if (agents.length === 0) reset();

export const traceRoom: RoomModule = {
  id: "trace",
  title: "XVIII · Trace",
  copy: "They never speak. The floor carries the message.",
  hint: "click to plant or remove a source · C clears trails · Space pause · R reset",

  enter({ setStatus }): void {
    setStatus("trace / indirect communication");
  },

  draw({ stage }, dt): void {
    const dtSeconds = Math.min(dt, 32) / 1000;
    simulate(dtSeconds, stage.time);

    const { ctx, width, height } = stage;
    stage.clear("#03050a");
    stage.drawStars(0.035);

    drawField(ctx, width, height);

    stage.glow(
      NEST.x * width,
      NEST.y * height,
      width < 680 ? 38 : 54,
      "rgba(149,197,255,0.2)",
      "rgba(91,128,198,0)",
    );

    ctx.fillStyle = "rgba(221,238,255,0.85)";
    ctx.beginPath();
    ctx.arc(
      NEST.x * width,
      NEST.y * height,
      width < 680 ? 5 : 7,
      0,
      TAU,
    );
    ctx.fill();

    for (const source of sources) {
      stage.glow(
        source.x * width,
        source.y * height,
        width < 680 ? 30 : 42,
        "rgba(255,202,128,0.2)",
        "rgba(255,174,72,0)",
      );

      ctx.strokeStyle = "rgba(255,213,150,0.46)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        source.x * width,
        source.y * height,
        width < 680 ? 7 : 9,
        0,
        TAU,
      );
      ctx.stroke();

      ctx.fillStyle = "rgba(255,218,164,0.88)";
      ctx.beginPath();
      ctx.arc(
        source.x * width,
        source.y * height,
        width < 680 ? 2.5 : 3.3,
        0,
        TAU,
      );
      ctx.fill();
    }

    for (const agent of agents) {
      drawAgent(ctx, width, height, agent);
    }

    if (stage.pointer.active) {
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(stage.pointer.x, stage.pointer.y, 22, 0, TAU);
      ctx.stroke();
    }

    const stats = trailStats();
    const coverage = clamp(stats.active / (GRID_W * GRID_H * 2), 0, 1);

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle =
      coverage > 0.08
        ? "rgba(226,235,255,0.66)"
        : "rgba(226,235,255,0.38)";
    ctx.fillText(
      coverage > 0.08
        ? "No leader drew these roads."
        : "Give the floor time to remember.",
      width / 2,
      height - 78,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.24)";
    ctx.fillText(
      `CARRYING ${stats.carrying} · SOURCES ${sources.length}${paused ? " · PAUSED" : ""}`,
      width / 2,
      height - 54,
    );
  },

  click({ stage, setStatus }, x, y): void {
    const nx = clamp(x / Math.max(stage.width, 1), 0.04, 0.96);
    const ny = clamp(y / Math.max(stage.height, 1), 0.05, 0.95);

    let nearestIndex = -1;
    let nearestDistance = 0.052;

    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      const d = Math.hypot(source.x - nx, source.y - ny);
      if (d < nearestDistance) {
        nearestIndex = index;
        nearestDistance = d;
      }
    }

    if (nearestIndex >= 0) {
      sources.splice(nearestIndex, 1);
      setStatus("trace / source removed");
      return;
    }

    if (sources.length >= MAX_SOURCES) sources.shift();
    sources.push({ x: nx, y: ny });
    setStatus("trace / source planted");
  },

  key(env, event): void {
    const key = event.key.toLowerCase();

    if (key === "r") {
      reset();
      env.setStatus("trace / canonical colony restored");
      return;
    }

    if (key === "c") {
      homeField.fill(0);
      foodField.fill(0);
      env.setStatus("trace / floor cleared");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "trace / paused" : "trace / moving");
    }
  },
};
