import type { RoomModule } from "../core/room";
import type { Point } from "../core/stage";
import { Stage, TAU, clamp, rand } from "../core/stage";

type Body = Point & {
  vx: number;
  vy: number;
  mass: number;
  trail: Point[];
};

let bodies: Body[] = [];
let paused = false;

function seedBodies(stage: Stage): void {
  bodies = [];
  const cx = stage.width / 2;
  const cy = stage.height / 2;

  bodies.push({
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    mass: 980,
    trail: [],
  });

  for (let i = 0; i < 7; i += 1) {
    const angle = rand(0, TAU);
    const radius = rand(72, Math.min(stage.width, stage.height) * 0.34);
    const speed = Math.sqrt(42_000 / Math.max(radius, 40)) * rand(0.72, 1.08);
    bodies.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: -Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
      mass: rand(3, 18),
      trail: [],
    });
  }
}

function updateBodies(stage: Stage, dt: number): void {
  if (paused) return;

  // requestAnimationFrame gives us milliseconds. The orbital velocities and
  // accelerations below are expressed per second, so integrate in seconds.
  // Clamp unusually long frames so returning to a backgrounded tab does not
  // catapult the whole system into deep space.
  const dtSeconds = Math.min(dt, 32) / 1000;
  const G = 45;
  const accelerations = bodies.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const r2 = Math.max(dx * dx + dy * dy, 90);
      const r = Math.sqrt(r2);
      const force = G / r2;
      accelerations[i].x += (dx / r) * force * b.mass;
      accelerations[i].y += (dy / r) * force * b.mass;
      accelerations[j].x -= (dx / r) * force * a.mass;
      accelerations[j].y -= (dy / r) * force * a.mass;
    }
  }

  bodies.forEach((body, index) => {
    body.vx += accelerations[index].x * dtSeconds;
    body.vy += accelerations[index].y * dtSeconds;
    body.x += body.vx * dtSeconds;
    body.y += body.vy * dtSeconds;
    body.trail.push({ x: body.x, y: body.y });
    if (body.trail.length > 72) body.trail.shift();
  });

  bodies = bodies.filter(
    (body, index) =>
      index === 0 ||
      (body.x > -240 && body.x < stage.width + 240 && body.y > -240 && body.y < stage.height + 240),
  );
}

function drawGravitas(stage: Stage, dt: number): void {
  stage.clear("#040408");
  stage.drawStars(0.33);
  updateBodies(stage, dt);

  bodies.forEach((body, index) => {
    if (body.trail.length > 1) {
      stage.ctx.beginPath();
      body.trail.forEach((point, trailIndex) => {
        if (trailIndex === 0) stage.ctx.moveTo(point.x, point.y);
        else stage.ctx.lineTo(point.x, point.y);
      });
      stage.ctx.strokeStyle = index === 0 ? "rgba(255,232,190,0.06)" : "rgba(176,197,255,0.17)";
      stage.ctx.lineWidth = 0.75;
      stage.ctx.stroke();
    }

    const radius = index === 0 ? 9 : clamp(Math.sqrt(body.mass) * 1.4, 2, 8);
    if (index === 0) {
      stage.glow(body.x, body.y, 56, "rgba(255,240,209,0.38)", "rgba(255,222,160,0)");
      stage.ctx.fillStyle = "#fff8e7";
    } else {
      stage.glow(body.x, body.y, radius * 4.2, "rgba(197,213,255,0.28)", "rgba(120,145,255,0)");
      stage.ctx.fillStyle = "#dfe7ff";
    }
    stage.ctx.beginPath();
    stage.ctx.arc(body.x, body.y, radius, 0, TAU);
    stage.ctx.fill();
  });

  stage.ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  stage.ctx.textAlign = "left";
  stage.ctx.fillStyle = "rgba(255,255,255,0.26)";
  stage.ctx.fillText(`${bodies.length} BODIES${paused ? " / PAUSED" : ""}`, 28, stage.height - 74);
}

function addBody(stage: Stage, x: number, y: number): void {
  const cx = stage.width / 2;
  const cy = stage.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.max(Math.hypot(dx, dy), 40);
  const speed = Math.sqrt(42_000 / r) * rand(0.72, 1.18);
  bodies.push({
    x,
    y,
    vx: (-dy / r) * speed,
    vy: (dx / r) * speed,
    mass: rand(4, 26),
    trail: [],
  });
}

export const gravitasRoom: RoomModule = {
  id: "gravitas",
  title: "I · Gravitas",
  copy: "A tiny universe with no undo. Every click gives the system another problem.",
  hint: "click to add a body · R clears · space pauses",

  enter({ stage }): void {
    if (bodies.length < 2) seedBodies(stage);
  },

  resize({ stage }): void {
    if (bodies.length === 0) seedBodies(stage);
  },

  draw({ stage }, dt): void {
    drawGravitas(stage, dt);
  },

  click({ stage }, x, y): void {
    addBody(stage, x, y);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      seedBodies(env.stage);
      env.setStatus("gravity / reset");
    }
    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "gravity / paused" : "gravity / awake");
    }
  },
};
