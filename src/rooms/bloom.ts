import type { RoomModule } from "../core/room";
import type { Point } from "../core/stage";
import { Stage, TAU, clamp, rand } from "../core/stage";

type Dust = Point & {
  vx: number;
  vy: number;
  life: number;
  seed: number;
};

let dust: Dust[] = [];

function seedDust(stage: Stage): void {
  const count = Math.min(1100, Math.floor((stage.width * stage.height) / 1100));
  dust = Array.from({ length: count }, () => ({
    x: rand(0, stage.width),
    y: rand(0, stage.height),
    vx: 0,
    vy: 0,
    life: rand(0.35, 1),
    seed: rand(0, 1000),
  }));
}

function updateDust(stage: Stage, dt: number): void {
  const influence = Math.min(stage.width, stage.height) * 0.22;

  for (const p of dust) {
    const angle =
      Math.sin(p.x * 0.006 + stage.time * 0.00028 + p.seed) * 1.8 +
      Math.cos(p.y * 0.005 - stage.time * 0.00022) * 1.3;

    p.vx += Math.cos(angle) * 0.016 * dt;
    p.vy += Math.sin(angle) * 0.016 * dt;

    if (stage.pointer.active) {
      const dx = p.x - stage.pointer.x;
      const dy = p.y - stage.pointer.y;
      const r = Math.max(Math.hypot(dx, dy), 8);
      if (r < influence) {
        const sign = stage.pointer.down ? 1 : -0.18;
        const strength = (1 - r / influence) * sign * 0.12 * dt;
        p.vx += (dx / r) * strength;
        p.vy += (dy / r) * strength;
      }
    }

    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = stage.width + 10;
    if (p.x > stage.width + 10) p.x = -10;
    if (p.y < -10) p.y = stage.height + 10;
    if (p.y > stage.height + 10) p.y = -10;
  }
}

function burst(x: number, y: number): void {
  const amount = 56;
  for (let i = 0; i < amount; i += 1) {
    const angle = (i / amount) * TAU + rand(-0.05, 0.05);
    const speed = rand(1.2, 4.5);
    dust.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      seed: rand(0, 1000),
    });
  }
  if (dust.length > 1500) dust.splice(0, dust.length - 1500);
}

function drawBloom(stage: Stage, dt: number): void {
  stage.ctx.fillStyle = "rgba(4,5,11,0.17)";
  stage.ctx.fillRect(0, 0, stage.width, stage.height);
  updateDust(stage, dt);

  for (const p of dust) {
    const speed = Math.hypot(p.vx, p.vy);
    stage.ctx.globalAlpha = clamp(0.14 + speed * 0.12, 0.08, 0.7);
    stage.ctx.fillStyle = speed > 1.3 ? "#ffffff" : "#b9c6ff";
    stage.ctx.fillRect(p.x, p.y, 1.15 + speed * 0.18, 1.15 + speed * 0.18);
  }
  stage.ctx.globalAlpha = 1;

  if (stage.pointer.active) {
    stage.glow(
      stage.pointer.x,
      stage.pointer.y,
      stage.pointer.down ? 88 : 44,
      stage.pointer.down ? "rgba(216,192,255,0.1)" : "rgba(183,205,255,0.07)",
      "rgba(120,130,255,0)",
    );
  }
}

export const bloomRoom: RoomModule = {
  id: "bloom",
  title: "II · Bloom",
  copy: "A field that remembers disturbance only long enough to become beautiful.",
  hint: "move to bend the field · hold to repel · click releases a seed",

  enter({ stage }): void {
    if (dust.length < 50) seedDust(stage);
  },

  resize({ stage }): void {
    if (dust.length === 0) seedDust(stage);
  },

  draw({ stage }, dt): void {
    drawBloom(stage, dt);
  },

  click({ stage }, x, y): void {
    burst(x, y);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      seedDust(env.stage);
      env.stage.clear("#050509");
      env.setStatus("field / reseeded");
    }
  },
};
