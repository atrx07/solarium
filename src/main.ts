import "./style.css";

type Room = "atrium" | "gravitas" | "bloom" | "resonance";

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

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Solarium could not find its mount point.");

app.innerHTML = `
  <canvas id="stage" aria-label="Interactive Solarium canvas"></canvas>
  <div class="shell">
    <div class="brand"><strong>SOLARIUM</strong><span>001 / GENESIS</span></div>
    <section class="room-meta" aria-live="polite">
      <h1 id="room-title">The Atrium</h1>
      <p id="room-copy">Three quiet anomalies are orbiting the light. Pick one.</p>
    </section>
    <button class="back" id="back" type="button" hidden>← Atrium</button>
    <div class="hint" id="hint">move slowly · click an orbiting anomaly · keys 1 2 3</div>
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
    copy: "Three quiet anomalies are orbiting the light. Pick one.",
    hint: "move slowly · click an orbiting anomaly · keys 1 2 3",
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
  const rooms: Array<Exclude<Room, "atrium">> = ["gravitas", "bloom", "resonance"];

  return rooms.map((target, index) => {
    const a = angle + index * (TAU / 3) - Math.PI / 2;
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

  requestAnimationFrame(frame);
}

resize();
clear("#050509");
enterRoom("atrium");
requestAnimationFrame(frame);
