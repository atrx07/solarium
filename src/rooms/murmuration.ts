import type { RoomModule } from "../core/room";
import type { Point } from "../core/stage";
import { Stage, TAU, clamp, rand } from "../core/stage";

type Boid = Point & {
  vx: number;
  vy: number;
  phase: number;
  size: number;
};

type Shock = Point & {
  radius: number;
  life: number;
};

let flock: Boid[] = [];
let shocks: Shock[] = [];

function seedFlock(stage: Stage): void {
  const count = Math.min(170, Math.max(90, Math.floor((stage.width * stage.height) / 8500)));
  const cx = stage.width / 2;
  const cy = stage.height / 2;
  const spread = Math.min(stage.width, stage.height) * 0.26;

  flock = Array.from({ length: count }, (_, index) => {
    const angle = rand(0, TAU);
    const radius = Math.sqrt(Math.random()) * spread;
    const heading = angle + Math.PI / 2 + rand(-0.9, 0.9);
    const speed = rand(34, 68);

    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius * 0.72,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      phase: rand(0, TAU) + index * 0.03,
      size: rand(1.2, 2.5),
    };
  });

  shocks = [];
}

function addShock(x: number, y: number): void {
  shocks.push({ x, y, radius: 8, life: 1 });

  for (const bird of flock) {
    const dx = bird.x - x;
    const dy = bird.y - y;
    const distance = Math.max(Math.hypot(dx, dy), 8);
    if (distance > 210) continue;

    const strength = (1 - distance / 210) * 105;
    bird.vx += (dx / distance) * strength;
    bird.vy += (dy / distance) * strength;
  }
}

function updateFlock(stage: Stage, dt: number): void {
  const dtSeconds = Math.min(dt, 32) / 1000;
  const neighborRadius = 74;
  const separationRadius = 24;
  const maxSpeed = 92;
  const minSpeed = 28;
  const nextVelocity = flock.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < flock.length; i += 1) {
    const bird = flock[i];
    let count = 0;
    let alignX = 0;
    let alignY = 0;
    let centerX = 0;
    let centerY = 0;
    let separateX = 0;
    let separateY = 0;

    for (let j = 0; j < flock.length; j += 1) {
      if (i === j) continue;
      const other = flock[j];
      const dx = other.x - bird.x;
      const dy = other.y - bird.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared > neighborRadius * neighborRadius) continue;

      const distance = Math.sqrt(Math.max(distanceSquared, 1));
      count += 1;
      alignX += other.vx;
      alignY += other.vy;
      centerX += other.x;
      centerY += other.y;

      if (distance < separationRadius) {
        const pressure = 1 - distance / separationRadius;
        separateX -= (dx / distance) * pressure;
        separateY -= (dy / distance) * pressure;
      }
    }

    let ax = 0;
    let ay = 0;

    if (count > 0) {
      alignX /= count;
      alignY /= count;
      centerX /= count;
      centerY /= count;

      ax += (alignX - bird.vx) * 0.48;
      ay += (alignY - bird.vy) * 0.48;
      ax += (centerX - bird.x) * 0.23;
      ay += (centerY - bird.y) * 0.23;
      ax += separateX * 165;
      ay += separateY * 165;
    }

    if (stage.pointer.active) {
      const dx = stage.pointer.x - bird.x;
      const dy = stage.pointer.y - bird.y;
      const distance = Math.max(Math.hypot(dx, dy), 10);
      const influence = Math.min(stage.width, stage.height) * 0.3;

      if (distance < influence) {
        const proximity = 1 - distance / influence;
        const sign = stage.pointer.down ? -1 : 1;
        const strength = stage.pointer.down ? 155 : 18;
        ax += (dx / distance) * proximity * strength * sign;
        ay += (dy / distance) * proximity * strength * sign;
      }
    }

    const margin = Math.min(120, Math.min(stage.width, stage.height) * 0.14);
    if (bird.x < margin) ax += (margin - bird.x) * 0.9;
    if (bird.x > stage.width - margin) ax -= (bird.x - (stage.width - margin)) * 0.9;
    if (bird.y < margin) ay += (margin - bird.y) * 0.9;
    if (bird.y > stage.height - margin) ay -= (bird.y - (stage.height - margin)) * 0.9;

    const ambient = Math.sin(stage.time * 0.00042 + bird.phase) * 10;
    ax += Math.cos(bird.phase + stage.time * 0.00017) * ambient;
    ay += Math.sin(bird.phase * 1.3 - stage.time * 0.00014) * ambient;

    nextVelocity[i].x = bird.vx + ax * dtSeconds;
    nextVelocity[i].y = bird.vy + ay * dtSeconds;
  }

  flock.forEach((bird, index) => {
    let vx = nextVelocity[index].x;
    let vy = nextVelocity[index].y;
    let speed = Math.hypot(vx, vy);

    if (speed > maxSpeed) {
      vx = (vx / speed) * maxSpeed;
      vy = (vy / speed) * maxSpeed;
      speed = maxSpeed;
    } else if (speed < minSpeed) {
      const fallback = speed < 0.001 ? bird.phase : Math.atan2(vy, vx);
      vx = Math.cos(fallback) * minSpeed;
      vy = Math.sin(fallback) * minSpeed;
    }

    bird.vx = vx;
    bird.vy = vy;
    bird.x += bird.vx * dtSeconds;
    bird.y += bird.vy * dtSeconds;
  });

  for (const shock of shocks) {
    shock.radius += 135 * dtSeconds;
    shock.life -= 0.82 * dtSeconds;
  }
  shocks = shocks.filter((shock) => shock.life > 0);
}

function drawMurmuration(stage: Stage, dt: number): void {
  stage.clear("#04050a");
  stage.drawStars(0.22);
  updateFlock(stage, dt);

  for (const shock of shocks) {
    stage.ctx.globalAlpha = clamp(shock.life, 0, 1) * 0.32;
    stage.ctx.strokeStyle = "#dce5ff";
    stage.ctx.lineWidth = 1;
    stage.ctx.beginPath();
    stage.ctx.arc(shock.x, shock.y, shock.radius, 0, TAU);
    stage.ctx.stroke();
  }
  stage.ctx.globalAlpha = 1;

  for (const bird of flock) {
    const angle = Math.atan2(bird.vy, bird.vx);
    const speed = Math.hypot(bird.vx, bird.vy);
    const length = bird.size * (2.2 + speed / 55);

    stage.ctx.save();
    stage.ctx.translate(bird.x, bird.y);
    stage.ctx.rotate(angle);
    stage.ctx.globalAlpha = clamp(0.42 + speed / 180, 0.42, 0.9);
    stage.ctx.fillStyle = "#e7ebff";
    stage.ctx.beginPath();
    stage.ctx.moveTo(length, 0);
    stage.ctx.lineTo(-bird.size * 1.7, bird.size * 0.82);
    stage.ctx.lineTo(-bird.size * 0.75, 0);
    stage.ctx.lineTo(-bird.size * 1.7, -bird.size * 0.82);
    stage.ctx.closePath();
    stage.ctx.fill();
    stage.ctx.restore();
  }
  stage.ctx.globalAlpha = 1;

  if (stage.pointer.active) {
    stage.glow(
      stage.pointer.x,
      stage.pointer.y,
      stage.pointer.down ? 62 : 28,
      stage.pointer.down ? "rgba(255,205,220,0.09)" : "rgba(206,221,255,0.06)",
      "rgba(120,140,255,0)",
    );
  }

  stage.ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  stage.ctx.textAlign = "left";
  stage.ctx.fillStyle = "rgba(255,255,255,0.24)";
  stage.ctx.fillText(`${flock.length} / NO LEADER`, 28, stage.height - 74);
}

export const murmurationRoom: RoomModule = {
  id: "murmuration",
  title: "IV · Murmuration",
  copy: "A small population with no leader. Move gently and they notice. Press in and they remember fear.",
  hint: "move to become a landmark · hold to scatter · click sends a pulse · R reseeds",

  enter({ stage }): void {
    if (flock.length < 20) seedFlock(stage);
  },

  resize({ stage }): void {
    if (flock.length === 0) seedFlock(stage);
  },

  draw({ stage }, dt): void {
    drawMurmuration(stage, dt);
  },

  click({ stage }, x, y): void {
    addShock(x, y);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      seedFlock(env.stage);
      env.setStatus("flock / reborn");
    }
  },
};
