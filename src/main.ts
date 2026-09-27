import "./style.css";

type Room = "atrium" | "gravitas" | "bloom" | "resonance" | "murmuration" | "mycelium";

type Point = {
  x: number;
  y: number;
};

type Star = Point & {
  z: number;
  twinkle: number;
  size: number;
};

type Body = Point & {
  vx: number;
  vy: number;
  mass: number;
  trail: Point[];
};

type Dust = Point & {
  vx: number;
  vy: number;
  life: number;
  seed: number;
};

type Ring = Point & {
  radius: number;
  life: number;
  frequency: number;
};

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

type HyphaSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  generation: number;
  age: number;
};

type HyphaTip = Point & {
  angle: number;
  speed: number;
  energy: number;
  generation: number;
  phase: number;
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Solarium could not find its mount point.");

app.innerHTML = `
  <canvas id="stage" aria-label="Interactive Solarium canvas"></canvas>
  <div class="shell">
    <div class="brand"><strong>SOLARIUM</strong><span>003 / MYCELIUM</span></div>
    <section class="room-meta" aria-live="polite">
      <h1 id="room-title">The Atrium</h1>
      <p id="room-copy">Five quiet anomalies are orbiting the light. Pick one.</p>
    </section>
    <button class="back" id="back" type="button" hidden>← Atrium</button>
    <div class="hint" id="hint">move slowly · click an orbiting anomaly · keys 1 2 3 4 5</div>
    <div class="status" id="status">local / awake</div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
const titleEl = document.querySelector<HTMLElement>("#room-title");
const copyEl = document.querySelector<HTMLElement>("#room-copy");
const hintEl = document.querySelector<HTMLElement>("#hint");
const statusEl = document.querySelector<HTMLElement>("#status");
const backEl = document.querySelector<HTMLButtonElement>("#back");

if (!canvas || !titleEl || !copyEl || !hintEl || !statusEl || !backEl) {
  throw new Error("Solarium interface failed to initialize.");
}

const ctx = canvas.getContext("2d", { alpha: false });
if (!ctx) throw new Error("Canvas 2D is unavailable.");

const TAU = Math.PI * 2;
let width = 0;
let height = 0;
let dpr = 1;
let time = 0;
let room: Room = "atrium";
let pointer = { x: 0, y: 0, down: false, active: false };
let stars: Star[] = [];
let bodies: Body[] = [];
let dust: Dust[] = [];
let rings: Ring[] = [];
let flock: Boid[] = [];
let shocks: Shock[] = [];
let hyphae: HyphaSegment[] = [];
let hyphaTips: HyphaTip[] = [];
let resonanceUnlocked = false;
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

const visited = new Set<Room>(
  ((localStorage.getItem("solarium.visited") ?? "")
    .split(",")
    .filter(Boolean) as Room[]),
);

const roomInfo: Record<Room, { title: string; copy: string; hint: string }> = {
  atrium: {
    title: "The Atrium",
    copy: "Five quiet anomalies are orbiting the light. Pick one.",
    hint: "move slowly · click an orbiting anomaly · keys 1 2 3 4 5",
  },
  gravitas: {
    title: "I · Gravitas",
    copy: "A tiny universe with no undo. Every click gives the system another problem.",
    hint: "click to add a body · R clears · space pauses",
  },
  bloom: {
    title: "II · Bloom",
    copy: "A field that remembers disturbance only long enough to become beautiful.",
    hint: "move to bend the field · hold to repel · click releases a seed",
  },
  resonance: {
    title: "III · Resonance",
    copy: "Light translated into small, temporary sounds. Nothing is recorded.",
    hint: "click anywhere to wake sound · horizontal = pitch · vertical = decay",
  },
  murmuration: {
    title: "IV · Murmuration",
    copy: "A small population with no leader. Move gently and they notice. Press in and they remember fear.",
    hint: "move to become a landmark · hold to scatter · click sends a pulse · R reseeds",
  },
  mycelium: {
    title: "V · Mycelium",
    copy: "A colony that grows without asking. Hover and it notices. Hold and you become food.",
    hint: "move to bend growth · hold to feed · click plants a spore · R regrows",
  },
};

let paused = false;

function rand(min = 0, max = 1): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (stars.length === 0) {
    stars = Array.from({ length: Math.min(420, Math.floor((width * height) / 4200)) }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      z: rand(0.15, 1),
      twinkle: rand(0, TAU),
      size: rand(0.3, 1.5),
    }));
  } else {
    stars.forEach((star) => {
      star.x = clamp(star.x, 0, width);
      star.y = clamp(star.y, 0, height);
    });
  }

  if (dust.length === 0) seedDust();
  if (bodies.length === 0) seedBodies();
  if (flock.length === 0) seedFlock();
  if (hyphaTips.length === 0 && hyphae.length === 0) seedMycelium();
}

function clear(color = "#050509"): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(intensity = 1): void {
  const px = pointer.active ? (pointer.x - width / 2) / width : 0;
  const py = pointer.active ? (pointer.y - height / 2) / height : 0;

  for (const star of stars) {
    const shimmer = 0.42 + Math.sin(time * 0.0013 + star.twinkle) * 0.22;
    const x = star.x - px * 24 * star.z;
    const y = star.y - py * 24 * star.z;
    ctx.globalAlpha = clamp(shimmer * star.z * intensity, 0.06, 0.9);
    ctx.fillStyle = "#f8f7ff";
    ctx.beginPath();
    ctx.arc(x, y, star.size * star.z, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function glow(x: number, y: number, radius: number, core: string, edge: string): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.18, core);
  gradient.addColorStop(1, edge);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function orbitNodes(): Array<{ room: Exclude<Room, "atrium">; x: number; y: number; r: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const orbit = Math.min(width, height) * 0.28;
  const angle = time * 0.00012;
  const rooms: Array<Exclude<Room, "atrium">> = ["gravitas", "bloom", "resonance", "murmuration", "mycelium"];

  return rooms.map((target, index) => {
    const a = angle + index * (TAU / rooms.length) - Math.PI / 2;
    return {
      room: target,
      x: cx + Math.cos(a) * orbit,
      y: cy + Math.sin(a) * orbit * 0.64,
      r: 12 + index * 2,
    };
  });
}

function drawAtrium(): void {
  clear("#050509");
  drawStars(1);

  const cx = width / 2;
  const cy = height / 2;
  const orbit = Math.min(width, height) * 0.28;

  ctx.strokeStyle = "rgba(255,255,255,0.055)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, orbit, orbit * 0.64, 0, 0, TAU);
  ctx.stroke();

  const breathe = 1 + Math.sin(time * 0.0011) * 0.045;
  glow(cx, cy, 96 * breathe, "rgba(255,242,210,0.22)", "rgba(255,220,160,0)");
  glow(cx, cy, 22 * breathe, "rgba(255,250,235,1)", "rgba(255,226,171,0)");

  if (pointer.active) {
    const gradient = ctx.createLinearGradient(cx, cy, pointer.x, pointer.y);
    gradient.addColorStop(0, "rgba(255,245,220,0.14)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pointer.x, pointer.y);
    ctx.stroke();
  }

  for (const [index, node] of orbitNodes().entries()) {
    const hovered = pointer.active && dist(pointer, node) < 34;
    const pulse = 1 + Math.sin(time * 0.002 + index * 1.7) * 0.12;
    const visitedBoost = visited.has(node.room) ? 1 : 0.72;

    glow(
      node.x,
      node.y,
      (hovered ? 42 : 28) * pulse,
      hovered ? "rgba(207,221,255,0.44)" : "rgba(185,198,255,0.23)",
      "rgba(120,140,255,0)",
    );

    ctx.fillStyle = hovered ? "#ffffff" : `rgba(232,236,255,${visitedBoost})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, hovered ? node.r * 0.7 : node.r * 0.48, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.17)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r + 9 + Math.sin(time * 0.0015 + index) * 3, 0, TAU);
    ctx.stroke();

    if (hovered) {
      const label = roomInfo[node.room].title.toUpperCase();
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(label, node.x, node.y + 42);
    }
  }

  ctx.textAlign = "center";
  ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText("ENTER NOTHING / LEAVE DIFFERENT", cx, cy + 142);
}

function seedBodies(): void {
  bodies = [];
  const cx = width / 2;
  const cy = height / 2;

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
    const radius = rand(72, Math.min(width, height) * 0.34);
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

function updateBodies(dt: number): void {
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
      (body.x > -240 && body.x < width + 240 && body.y > -240 && body.y < height + 240),
  );
}

function drawGravitas(dt: number): void {
  clear("#040408");
  drawStars(0.33);
  updateBodies(dt);

  bodies.forEach((body, index) => {
    if (body.trail.length > 1) {
      ctx.beginPath();
      body.trail.forEach((point, trailIndex) => {
        if (trailIndex === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = index === 0 ? "rgba(255,232,190,0.06)" : "rgba(176,197,255,0.17)";
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    const radius = index === 0 ? 9 : clamp(Math.sqrt(body.mass) * 1.4, 2, 8);
    if (index === 0) {
      glow(body.x, body.y, 56, "rgba(255,240,209,0.38)", "rgba(255,222,160,0)");
      ctx.fillStyle = "#fff8e7";
    } else {
      glow(body.x, body.y, radius * 4.2, "rgba(197,213,255,0.28)", "rgba(120,145,255,0)");
      ctx.fillStyle = "#dfe7ff";
    }
    ctx.beginPath();
    ctx.arc(body.x, body.y, radius, 0, TAU);
    ctx.fill();
  });

  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.fillText(`${bodies.length} BODIES${paused ? " / PAUSED" : ""}`, 28, height - 74);
}

function addBody(x: number, y: number): void {
  const cx = width / 2;
  const cy = height / 2;
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

function seedDust(): void {
  const count = Math.min(1100, Math.floor((width * height) / 1100));
  dust = Array.from({ length: count }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    vx: 0,
    vy: 0,
    life: rand(0.35, 1),
    seed: rand(0, 1000),
  }));
}

function updateDust(dt: number): void {
  const influence = Math.min(width, height) * 0.22;

  for (const p of dust) {
    const angle =
      Math.sin(p.x * 0.006 + time * 0.00028 + p.seed) * 1.8 +
      Math.cos(p.y * 0.005 - time * 0.00022) * 1.3;

    p.vx += Math.cos(angle) * 0.016 * dt;
    p.vy += Math.sin(angle) * 0.016 * dt;

    if (pointer.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const r = Math.max(Math.hypot(dx, dy), 8);
      if (r < influence) {
        const sign = pointer.down ? 1 : -0.18;
        const strength = (1 - r / influence) * sign * 0.12 * dt;
        p.vx += (dx / r) * strength;
        p.vy += (dy / r) * strength;
      }
    }

    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;
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

function drawBloom(dt: number): void {
  ctx.fillStyle = "rgba(4,5,11,0.17)";
  ctx.fillRect(0, 0, width, height);
  updateDust(dt);

  for (const p of dust) {
    const speed = Math.hypot(p.vx, p.vy);
    ctx.globalAlpha = clamp(0.14 + speed * 0.12, 0.08, 0.7);
    ctx.fillStyle = speed > 1.3 ? "#ffffff" : "#b9c6ff";
    ctx.fillRect(p.x, p.y, 1.15 + speed * 0.18, 1.15 + speed * 0.18);
  }
  ctx.globalAlpha = 1;

  if (pointer.active) {
    glow(
      pointer.x,
      pointer.y,
      pointer.down ? 88 : 44,
      pointer.down ? "rgba(216,192,255,0.1)" : "rgba(183,205,255,0.07)",
      "rgba(120,130,255,0)",
    );
  }
}

function ensureAudio(): void {
  if (audioContext) return;
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.18;
  masterGain.connect(audioContext.destination);
  resonanceUnlocked = true;
  setStatus("audio / awake");
}

function noteFrequency(x: number): number {
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  const index = Math.floor(clamp(x / width, 0, 0.999) * scale.length);
  const semitone = scale[index];
  return 110 * Math.pow(2, semitone / 12);
}

function playTone(x: number, y: number): void {
  ensureAudio();
  if (!audioContext || !masterGain) return;

  void audioContext.resume();
  const now = audioContext.currentTime;
  const frequency = noteFrequency(x);
  const decay = 0.35 + (1 - y / height) * 2.4;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(frequency * 3.8, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + decay + 0.05);

  rings.push({ x, y, radius: 4, life: 1, frequency });
}

function drawResonance(dt: number): void {
  clear("#050509");
  drawStars(0.58);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.36;

  for (let i = 1; i <= 5; i += 1) {
    ctx.strokeStyle = `rgba(210,220,255,${0.025 + i * 0.008})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, (maxRadius / 5) * i, 0, TAU);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  for (let i = 0; i < 9; i += 1) {
    const x = (width / 9) * (i + 0.5);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (const ring of rings) {
    ring.radius += 0.08 * dt;
    ring.life -= 0.00075 * dt;
    ctx.globalAlpha = clamp(ring.life, 0, 1) * 0.5;
    ctx.strokeStyle = "#dfe7ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, TAU);
    ctx.stroke();

    const satelliteRadius = ring.radius * 0.45;
    const angle = time * 0.001 + ring.frequency * 0.004;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      ring.x + Math.cos(angle) * satelliteRadius,
      ring.y + Math.sin(angle) * satelliteRadius,
      1.5,
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  rings = rings.filter((ring) => ring.life > 0);

  if (!resonanceUnlocked) {
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("CLICK TO WAKE THE ROOM", cx, cy);
  }
}

function seedFlock(): void {
  const count = Math.min(170, Math.max(90, Math.floor((width * height) / 8500)));
  const cx = width / 2;
  const cy = height / 2;
  const spread = Math.min(width, height) * 0.26;

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

function updateFlock(dt: number): void {
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

    if (pointer.active) {
      const dx = pointer.x - bird.x;
      const dy = pointer.y - bird.y;
      const distance = Math.max(Math.hypot(dx, dy), 10);
      const influence = Math.min(width, height) * 0.3;

      if (distance < influence) {
        const proximity = 1 - distance / influence;
        const sign = pointer.down ? -1 : 1;
        const strength = pointer.down ? 155 : 18;
        ax += (dx / distance) * proximity * strength * sign;
        ay += (dy / distance) * proximity * strength * sign;
      }
    }

    const margin = Math.min(120, Math.min(width, height) * 0.14);
    if (bird.x < margin) ax += (margin - bird.x) * 0.9;
    if (bird.x > width - margin) ax -= (bird.x - (width - margin)) * 0.9;
    if (bird.y < margin) ay += (margin - bird.y) * 0.9;
    if (bird.y > height - margin) ay -= (bird.y - (height - margin)) * 0.9;

    const ambient = Math.sin(time * 0.00042 + bird.phase) * 10;
    ax += Math.cos(bird.phase + time * 0.00017) * ambient;
    ay += Math.sin(bird.phase * 1.3 - time * 0.00014) * ambient;

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

function drawMurmuration(dt: number): void {
  clear("#04050a");
  drawStars(0.22);
  updateFlock(dt);

  for (const shock of shocks) {
    ctx.globalAlpha = clamp(shock.life, 0, 1) * 0.32;
    ctx.strokeStyle = "#dce5ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shock.x, shock.y, shock.radius, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const bird of flock) {
    const angle = Math.atan2(bird.vy, bird.vx);
    const speed = Math.hypot(bird.vx, bird.vy);
    const length = bird.size * (2.2 + speed / 55);

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(angle);
    ctx.globalAlpha = clamp(0.42 + speed / 180, 0.42, 0.9);
    ctx.fillStyle = "#e7ebff";
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(-bird.size * 1.7, bird.size * 0.82);
    ctx.lineTo(-bird.size * 0.75, 0);
    ctx.lineTo(-bird.size * 1.7, -bird.size * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  if (pointer.active) {
    glow(
      pointer.x,
      pointer.y,
      pointer.down ? 62 : 28,
      pointer.down ? "rgba(255,205,220,0.09)" : "rgba(206,221,255,0.06)",
      "rgba(120,140,255,0)",
    );
  }

  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.fillText(`${flock.length} / NO LEADER`, 28, height - 74);
}

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

function seedMycelium(): void {
  hyphae = [];
  hyphaTips = [];

  const cx = width / 2;
  const cy = height / 2;
  const spread = Math.min(width, height) * 0.18;

  plantSpore(cx - spread * 0.85, cy + spread * 0.35);
  plantSpore(cx + spread * 0.72, cy - spread * 0.42);
  plantSpore(cx + rand(-spread * 0.2, spread * 0.2), cy + spread * 0.9);
}

function updateMycelium(dt: number): void {
  const dtSeconds = Math.min(dt, 32) / 1000;
  const newTips: HyphaTip[] = [];

  for (const tip of hyphaTips) {
    tip.energy -= dtSeconds;
    if (tip.energy <= 0) continue;

    const wander =
      Math.sin(tip.x * 0.011 + tip.phase + time * 0.00032) +
      Math.cos(tip.y * 0.009 - tip.phase * 0.7 - time * 0.00027);

    tip.angle += wander * 0.21 * dtSeconds;

    if (pointer.active) {
      const dx = pointer.x - tip.x;
      const dy = pointer.y - tip.y;
      const distance = Math.max(Math.hypot(dx, dy), 8);
      const influence = Math.min(width, height) * (pointer.down ? 0.52 : 0.28);

      if (distance < influence) {
        const targetAngle = Math.atan2(dy, dx);
        let delta = targetAngle - tip.angle;
        while (delta > Math.PI) delta -= TAU;
        while (delta < -Math.PI) delta += TAU;

        const proximity = 1 - distance / influence;
        const pull = pointer.down ? 2.7 : 0.55;
        tip.angle += delta * proximity * pull * dtSeconds;

        if (pointer.down) {
          tip.energy = Math.min(tip.energy + proximity * 0.55 * dtSeconds, 12);
        }
      }
    }

    const margin = Math.min(72, Math.min(width, height) * 0.09);
    let edgeTurn = 0;
    if (tip.x < margin) edgeTurn += 1.4;
    if (tip.x > width - margin) edgeTurn -= 1.4;
    if (tip.y < margin) edgeTurn += Math.PI / 2;
    if (tip.y > height - margin) edgeTurn -= Math.PI / 2;
    if (edgeTurn !== 0) {
      const target = Math.atan2(height / 2 - tip.y, width / 2 - tip.x);
      let delta = target - tip.angle;
      while (delta > Math.PI) delta -= TAU;
      while (delta < -Math.PI) delta += TAU;
      tip.angle += delta * 1.8 * dtSeconds;
    }

    const oldX = tip.x;
    const oldY = tip.y;
    const speed = tip.speed * (pointer.down ? 1.08 : 1);
    tip.x += Math.cos(tip.angle) * speed * dtSeconds;
    tip.y += Math.sin(tip.angle) * speed * dtSeconds;

    if (
      tip.x < -24 ||
      tip.x > width + 24 ||
      tip.y < -24 ||
      tip.y > height + 24
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

    const branchRate = pointer.down ? 0.34 : 0.18;
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

function drawMycelium(dt: number): void {
  clear("#04050a");
  drawStars(0.14);
  updateMycelium(dt);

  for (const segment of hyphae) {
    const generationFade = clamp(1 - segment.generation * 0.08, 0.38, 1);
    const ageFade = clamp(1 - segment.age * 0.008, 0.34, 1);
    ctx.globalAlpha = 0.18 * generationFade * ageFade;
    ctx.strokeStyle = "#c9d6ff";
    ctx.lineWidth = clamp(1.7 - segment.generation * 0.1, 0.55, 1.7);
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  for (const tip of hyphaTips) {
    const pulse = 1 + Math.sin(time * 0.003 + tip.phase) * 0.24;
    glow(
      tip.x,
      tip.y,
      11 * pulse,
      "rgba(220,232,255,0.16)",
      "rgba(130,150,255,0)",
    );
    ctx.fillStyle = "rgba(238,243,255,0.78)";
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 1.15, 0, TAU);
    ctx.fill();
  }

  if (pointer.active) {
    glow(
      pointer.x,
      pointer.y,
      pointer.down ? 92 : 42,
      pointer.down ? "rgba(205,255,226,0.11)" : "rgba(208,224,255,0.06)",
      "rgba(110,160,145,0)",
    );
  }

  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.fillText(`${hyphaTips.length} TIPS / ${hyphae.length} VEINS`, 28, height - 74);
}

function setStatus(text: string): void {
  statusEl.textContent = text;
  statusEl.classList.remove("flash");
  void statusEl.offsetWidth;
  statusEl.classList.add("flash");
}

function persistVisit(target: Room): void {
  visited.add(target);
  localStorage.setItem("solarium.visited", [...visited].join(","));
}

function enterRoom(target: Room): void {
  room = target;
  const info = roomInfo[target];
  titleEl.textContent = info.title;
  copyEl.textContent = info.copy;
  hintEl.textContent = info.hint;
  backEl.hidden = target === "atrium";
  persistVisit(target);
  setStatus(target === "resonance" && resonanceUnlocked ? "audio / awake" : "local / awake");

  if (target === "gravitas" && bodies.length < 2) seedBodies();
  if (target === "bloom" && dust.length < 50) seedDust();
  if (target === "murmuration" && flock.length < 20) seedFlock();
  if (target === "mycelium" && hyphaTips.length === 0 && hyphae.length === 0) seedMycelium();
}

function handleCanvasClick(x: number, y: number): void {
  if (room === "atrium") {
    const hit = orbitNodes().find((node) => dist({ x, y }, node) < 38);
    if (hit) enterRoom(hit.room);
    return;
  }

  if (room === "gravitas") addBody(x, y);
  if (room === "bloom") burst(x, y);
  if (room === "resonance") playTone(x, y);
  if (room === "murmuration") addShock(x, y);
  if (room === "mycelium") plantSpore(x, y);
}

function pointFromEvent(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

canvas.addEventListener("pointermove", (event) => {
  const point = pointFromEvent(event);
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.active = true;
});

canvas.addEventListener("pointerdown", (event) => {
  const point = pointFromEvent(event);
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.down = true;
  pointer.active = true;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  const point = pointFromEvent(event);
  pointer.down = false;
  handleCanvasClick(point.x, point.y);
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
  pointer.down = false;
});

backEl.addEventListener("click", () => enterRoom("atrium"));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") enterRoom("atrium");

  if (room === "atrium") {
    if (event.key === "1") enterRoom("gravitas");
    if (event.key === "2") enterRoom("bloom");
    if (event.key === "3") enterRoom("resonance");
    if (event.key === "4") enterRoom("murmuration");
    if (event.key === "5") enterRoom("mycelium");
  }

  if (room === "gravitas") {
    if (event.key.toLowerCase() === "r") {
      seedBodies();
      setStatus("gravity / reset");
    }
    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      setStatus(paused ? "gravity / paused" : "gravity / awake");
    }
  }

  if (room === "bloom" && event.key.toLowerCase() === "r") {
    seedDust();
    clear("#050509");
    setStatus("field / reseeded");
  }

  if (room === "murmuration" && event.key.toLowerCase() === "r") {
    seedFlock();
    setStatus("flock / reborn");
  }

  if (room === "mycelium" && event.key.toLowerCase() === "r") {
    seedMycelium();
    setStatus("colony / regrown");
  }
});

window.addEventListener("resize", resize);

let previous = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - previous, 32);
  previous = now;
  time = now;

  if (room === "atrium") drawAtrium();
  if (room === "gravitas") drawGravitas(dt);
  if (room === "bloom") drawBloom(dt);
  if (room === "resonance") drawResonance(dt);
  if (room === "murmuration") drawMurmuration(dt);
  if (room === "mycelium") drawMycelium(dt);

  requestAnimationFrame(frame);
}

resize();
clear("#050509");
enterRoom("atrium");
requestAnimationFrame(frame);
