import type { RoomModule } from "../core/room";
import { Stage, TAU, clamp, rand } from "../core/stage";

type HyphaSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  generation: number;
  age: number;
};

type HyphaTip = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  energy: number;
  generation: number;
  phase: number;
};

let hyphae: HyphaSegment[] = [];
let hyphaTips: HyphaTip[] = [];

function plantSpore(x: number, y: number, generation = 0): void {
  const spokes = generation === 0 ? 7 : 3;

  for (let i = 0; i < spokes; i += 1) {
    const angle = (i / spokes) * TAU + rand(-0.32, 0.32);
    hyphaTips.push({
      x,
      y,
      angle,
      speed: rand(18, 34),
      energy: rand(5.8, 10.5),
      generation,
      phase: rand(0, TAU),
    });
  }

  if (hyphaTips.length > 150) {
    hyphaTips.splice(0, hyphaTips.length - 150);
  }
}

function seedMycelium(stage: Stage): void {
  hyphae = [];
  hyphaTips = [];

  const cx = stage.width / 2;
  const cy = stage.height / 2;
  const spread = Math.min(stage.width, stage.height) * 0.18;

  plantSpore(cx - spread * 0.85, cy + spread * 0.35);
  plantSpore(cx + spread * 0.72, cy - spread * 0.42);
  plantSpore(cx + rand(-spread * 0.2, spread * 0.2), cy + spread * 0.9);
}

function updateMycelium(stage: Stage, dt: number): void {
  const dtSeconds = Math.min(dt, 32) / 1000;
  const newTips: HyphaTip[] = [];

  for (const tip of hyphaTips) {
    tip.energy -= dtSeconds;
    if (tip.energy <= 0) continue;

    const wander =
      Math.sin(tip.x * 0.011 + tip.phase + stage.time * 0.00032) +
      Math.cos(tip.y * 0.009 - tip.phase * 0.7 - stage.time * 0.00027);

    tip.angle += wander * 0.21 * dtSeconds;

    if (stage.pointer.active) {
      const dx = stage.pointer.x - tip.x;
      const dy = stage.pointer.y - tip.y;
      const distance = Math.max(Math.hypot(dx, dy), 8);
      const influence = Math.min(stage.width, stage.height) * (stage.pointer.down ? 0.52 : 0.28);

      if (distance < influence) {
        const targetAngle = Math.atan2(dy, dx);
        let delta = targetAngle - tip.angle;
        while (delta > Math.PI) delta -= TAU;
        while (delta < -Math.PI) delta += TAU;

        const proximity = 1 - distance / influence;
        const pull = stage.pointer.down ? 2.7 : 0.55;
        tip.angle += delta * proximity * pull * dtSeconds;

        if (stage.pointer.down) {
          tip.energy = Math.min(tip.energy + proximity * 0.55 * dtSeconds, 12);
        }
      }
    }

    const margin = Math.min(72, Math.min(stage.width, stage.height) * 0.09);
    let edgeTurn = 0;
    if (tip.x < margin) edgeTurn += 1.4;
    if (tip.x > stage.width - margin) edgeTurn -= 1.4;
    if (tip.y < margin) edgeTurn += Math.PI / 2;
    if (tip.y > stage.height - margin) edgeTurn -= Math.PI / 2;
    if (edgeTurn !== 0) {
      const target = Math.atan2(stage.height / 2 - tip.y, stage.width / 2 - tip.x);
      let delta = target - tip.angle;
      while (delta > Math.PI) delta -= TAU;
      while (delta < -Math.PI) delta += TAU;
      tip.angle += delta * 1.8 * dtSeconds;
    }

    const oldX = tip.x;
    const oldY = tip.y;
    const speed = tip.speed * (stage.pointer.down ? 1.08 : 1);
    tip.x += Math.cos(tip.angle) * speed * dtSeconds;
    tip.y += Math.sin(tip.angle) * speed * dtSeconds;

    if (
      tip.x < -24 ||
      tip.x > stage.width + 24 ||
      tip.y < -24 ||
      tip.y > stage.height + 24
    ) {
      continue;
    }

    hyphae.push({
      x1: oldX,
      y1: oldY,
      x2: tip.x,
      y2: tip.y,
      generation: tip.generation,
      age: 0,
    });

    const branchRate = stage.pointer.down ? 0.34 : 0.18;
    if (
      hyphaTips.length + newTips.length < 150 &&
      tip.generation < 7 &&
      Math.random() < branchRate * dtSeconds
    ) {
      const side = Math.random() < 0.5 ? -1 : 1;
      newTips.push({
        x: tip.x,
        y: tip.y,
        angle: tip.angle + side * rand(0.42, 0.95),
        speed: tip.speed * rand(0.86, 1.08),
        energy: tip.energy * rand(0.48, 0.72),
        generation: tip.generation + 1,
        phase: rand(0, TAU),
      });
      tip.energy *= 0.82;
    }
  }

  hyphaTips = hyphaTips.filter((tip) => tip.energy > 0);
  hyphaTips.push(...newTips);

  for (const segment of hyphae) {
    segment.age += dtSeconds;
  }

  if (hyphae.length > 5200) {
    hyphae.splice(0, hyphae.length - 5200);
  }

  if (hyphaTips.length === 0 && hyphae.length > 0) {
    const last = hyphae[hyphae.length - 1];
    plantSpore(last.x2, last.y2, 1);
  }
}

function drawMycelium(stage: Stage, dt: number): void {
  stage.clear("#04050a");
  stage.drawStars(0.14);
  updateMycelium(stage, dt);

  for (const segment of hyphae) {
    const generationFade = clamp(1 - segment.generation * 0.08, 0.38, 1);
    const ageFade = clamp(1 - segment.age * 0.008, 0.34, 1);
    stage.ctx.globalAlpha = 0.18 * generationFade * ageFade;
    stage.ctx.strokeStyle = "#c9d6ff";
    stage.ctx.lineWidth = clamp(1.7 - segment.generation * 0.1, 0.55, 1.7);
    stage.ctx.beginPath();
    stage.ctx.moveTo(segment.x1, segment.y1);
    stage.ctx.lineTo(segment.x2, segment.y2);
    stage.ctx.stroke();
  }

  stage.ctx.globalAlpha = 1;

  for (const tip of hyphaTips) {
    const pulse = 1 + Math.sin(stage.time * 0.003 + tip.phase) * 0.24;
    stage.glow(
      tip.x,
      tip.y,
      11 * pulse,
      "rgba(220,232,255,0.16)",
      "rgba(130,150,255,0)",
    );
    stage.ctx.fillStyle = "rgba(238,243,255,0.78)";
    stage.ctx.beginPath();
    stage.ctx.arc(tip.x, tip.y, 1.15, 0, TAU);
    stage.ctx.fill();
  }

  if (stage.pointer.active) {
    stage.glow(
      stage.pointer.x,
      stage.pointer.y,
      stage.pointer.down ? 92 : 42,
      stage.pointer.down ? "rgba(205,255,226,0.11)" : "rgba(208,224,255,0.06)",
      "rgba(110,160,145,0)",
    );
  }

  stage.ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  stage.ctx.textAlign = "left";
  stage.ctx.fillStyle = "rgba(255,255,255,0.24)";
  stage.ctx.fillText(`${hyphaTips.length} TIPS / ${hyphae.length} VEINS`, 28, stage.height - 74);
}

export const myceliumRoom: RoomModule = {
  id: "mycelium",
  title: "V · Mycelium",
  copy: "A colony that grows without asking. Hover and it notices. Hold and you become food.",
  hint: "move to bend growth · hold to feed · click plants a spore · R regrows",

  enter({ stage }): void {
    if (hyphaTips.length === 0 && hyphae.length === 0) seedMycelium(stage);
  },

  resize({ stage }): void {
    if (hyphaTips.length === 0 && hyphae.length === 0) seedMycelium(stage);
  },

  draw({ stage }, dt): void {
    drawMycelium(stage, dt);
  },

  click({ stage }, x, y): void {
    plantSpore(x, y);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      seedMycelium(env.stage);
      env.setStatus("colony / regrown");
    }
  },
};
