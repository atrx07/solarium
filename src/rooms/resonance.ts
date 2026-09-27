import type { RoomEnvironment, RoomModule } from "../core/room";
import type { Point } from "../core/stage";
import { Stage, TAU, clamp } from "../core/stage";

type Ring = Point & {
  radius: number;
  life: number;
  frequency: number;
};

let rings: Ring[] = [];
let resonanceUnlocked = false;
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

function ensureAudio(env: RoomEnvironment): void {
  if (audioContext) return;
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.18;
  masterGain.connect(audioContext.destination);
  resonanceUnlocked = true;
  env.setStatus("audio / awake");
}

function noteFrequency(stage: Stage, x: number): number {
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  const index = Math.floor(clamp(x / stage.width, 0, 0.999) * scale.length);
  const semitone = scale[index];
  return 110 * Math.pow(2, semitone / 12);
}

function playTone(env: RoomEnvironment, x: number, y: number): void {
  ensureAudio(env);
  if (!audioContext || !masterGain) return;

  void audioContext.resume();
  const now = audioContext.currentTime;
  const frequency = noteFrequency(env.stage, x);
  const decay = 0.35 + (1 - y / env.stage.height) * 2.4;

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

function drawResonance(stage: Stage, dt: number): void {
  stage.clear("#050509");
  stage.drawStars(0.58);

  const cx = stage.width / 2;
  const cy = stage.height / 2;
  const maxRadius = Math.min(stage.width, stage.height) * 0.36;

  for (let i = 1; i <= 5; i += 1) {
    stage.ctx.strokeStyle = `rgba(210,220,255,${0.025 + i * 0.008})`;
    stage.ctx.lineWidth = 1;
    stage.ctx.beginPath();
    stage.ctx.arc(cx, cy, (maxRadius / 5) * i, 0, TAU);
    stage.ctx.stroke();
  }

  stage.ctx.strokeStyle = "rgba(255,255,255,0.045)";
  for (let i = 0; i < 9; i += 1) {
    const x = (stage.width / 9) * (i + 0.5);
    stage.ctx.beginPath();
    stage.ctx.moveTo(x, 0);
    stage.ctx.lineTo(x, stage.height);
    stage.ctx.stroke();
  }

  for (const ring of rings) {
    ring.radius += 0.08 * dt;
    ring.life -= 0.00075 * dt;
    stage.ctx.globalAlpha = clamp(ring.life, 0, 1) * 0.5;
    stage.ctx.strokeStyle = "#dfe7ff";
    stage.ctx.lineWidth = 1;
    stage.ctx.beginPath();
    stage.ctx.arc(ring.x, ring.y, ring.radius, 0, TAU);
    stage.ctx.stroke();

    const satelliteRadius = ring.radius * 0.45;
    const angle = stage.time * 0.001 + ring.frequency * 0.004;
    stage.ctx.fillStyle = "#ffffff";
    stage.ctx.beginPath();
    stage.ctx.arc(
      ring.x + Math.cos(angle) * satelliteRadius,
      ring.y + Math.sin(angle) * satelliteRadius,
      1.5,
      0,
      TAU,
    );
    stage.ctx.fill();
  }
  stage.ctx.globalAlpha = 1;
  rings = rings.filter((ring) => ring.life > 0);

  if (!resonanceUnlocked) {
    stage.ctx.textAlign = "center";
    stage.ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    stage.ctx.fillStyle = "rgba(255,255,255,0.3)";
    stage.ctx.fillText("CLICK TO WAKE THE ROOM", cx, cy);
  }
}

export const resonanceRoom: RoomModule = {
  id: "resonance",
  title: "III · Resonance",
  copy: "Light translated into small, temporary sounds. Nothing is recorded.",
  hint: "click anywhere to wake sound · horizontal = pitch · vertical = decay",

  enter(env): void {
    if (resonanceUnlocked) env.setStatus("audio / awake");
  },

  draw({ stage }, dt): void {
    drawResonance(stage, dt);
  },

  click(env, x, y): void {
    playTone(env, x, y);
  },
};
