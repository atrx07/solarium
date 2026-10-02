import type { RoomModule, RoomEnvironment } from "../core/room";
import type { Stage } from "../core/stage";
import { TAU, clamp } from "../core/stage";

type Wavefront = {
  u: number;
  v: number;
  radius: number;
  delivered: boolean;
};

type AudioGraph = {
  context: AudioContext;
  oscillator: OscillatorNode;
  gain: GainNode;
  pan: StereoPannerNode;
};

const BASE_AUDIO_HZ = 220;
const VISUAL_PERIOD = 0.42;
const WAVE_SPEED = 0.22;
const SOURCE_SPEED = 0.085;
const SOURCE_MIN_U = 0.18;
const SOURCE_MAX_U = 0.82;
const SOURCE_V = 0.44;

let sourceU = 0.3;
let direction: 1 | -1 = 1;
let listener = { u: 0.72, v: 0.52 };
let wavefronts: Wavefront[] = [];
let emissionClock = 0;
let paused = false;
let listenerFlash = 0;
let audio: AudioGraph | null = null;

function scaleFor(stage: Stage): number {
  return Math.max(1, Math.min(stage.width, stage.height));
}

function sourcePoint(stage: Stage): { x: number; y: number } {
  return {
    x: sourceU * stage.width,
    y: SOURCE_V * stage.height,
  };
}

function listenerPoint(stage: Stage): { x: number; y: number } {
  return {
    x: listener.u * stage.width,
    y: listener.v * stage.height,
  };
}

function soundButton(stage: Stage): { x: number; y: number } {
  return {
    x: stage.width - 65,
    y: Math.max(156, stage.height - 122),
  };
}

function sourceVelocityPixels(stage: Stage): { x: number; y: number } {
  return {
    x: paused ? 0 : direction * SOURCE_SPEED * scaleFor(stage),
    y: 0,
  };
}

function observedRatio(stage: Stage): number {
  const source = sourcePoint(stage);
  const ear = listenerPoint(stage);
  const dx = ear.x - source.x;
  const dy = ear.y - source.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const nx = dx / distance;
  const ny = dy / distance;
  const velocity = sourceVelocityPixels(stage);
  const toward = velocity.x * nx + velocity.y * ny;
  const c = WAVE_SPEED * scaleFor(stage);

  return clamp(c / Math.max(c * 0.35, c - toward), 0.62, 1.72);
}

function radialMotion(stage: Stage): number {
  return observedRatio(stage) - 1;
}

function reset(): void {
  sourceU = 0.3;
  direction = 1;
  listener = { u: 0.72, v: 0.52 };
  wavefronts = [];
  emissionClock = 0;
  paused = false;
  listenerFlash = 0;
}

function distanceToListenerUnits(
  front: Wavefront,
  stage: Stage,
): number {
  const dx = (listener.u - front.u) * stage.width;
  const dy = (listener.v - front.v) * stage.height;
  return Math.hypot(dx, dy) / scaleFor(stage);
}

function rearmWavefronts(stage: Stage): void {
  for (const front of wavefronts) {
    front.delivered = front.radius >= distanceToListenerUnits(front, stage);
  }
}

function emitWavefront(): void {
  wavefronts.push({
    u: sourceU,
    v: SOURCE_V,
    radius: 0,
    delivered: false,
  });

  if (wavefronts.length > 34) wavefronts.shift();
}

function simulate(stage: Stage, dtSeconds: number): void {
  if (paused) return;

  const scale = scaleFor(stage);
  const deltaPixels = direction * SOURCE_SPEED * scale * dtSeconds;
  sourceU += deltaPixels / Math.max(1, stage.width);

  if (sourceU >= SOURCE_MAX_U) {
    sourceU = SOURCE_MAX_U;
    direction = -1;
  } else if (sourceU <= SOURCE_MIN_U) {
    sourceU = SOURCE_MIN_U;
    direction = 1;
  }

  emissionClock += dtSeconds;
  while (emissionClock >= VISUAL_PERIOD) {
    emissionClock -= VISUAL_PERIOD;
    emitWavefront();
  }

  const maxRadius =
    Math.hypot(stage.width, stage.height) / scale + 0.2;

  for (const front of wavefronts) {
    front.radius += WAVE_SPEED * dtSeconds;

    if (
      !front.delivered &&
      front.radius >= distanceToListenerUnits(front, stage)
    ) {
      front.delivered = true;
      listenerFlash = 1;
    }
  }

  wavefronts = wavefronts.filter(
    (front) => front.radius <= maxRadius,
  );
}

function stopAudio(): void {
  const current = audio;
  audio = null;
  if (!current) return;

  try {
    current.oscillator.stop();
  } catch {
    // Already stopped.
  }
  void current.context.close().catch(() => {
    // Audio is optional.
  });
}

function syncAudio(stage: Stage): void {
  if (!audio || audio.context.state === "closed") return;

  const now = audio.context.currentTime;
  const ratio = observedRatio(stage);
  const source = sourcePoint(stage);
  const ear = listenerPoint(stage);
  const distance = Math.hypot(ear.x - source.x, ear.y - source.y);
  const scale = scaleFor(stage);
  const stereo = clamp(
    (source.x - ear.x) / Math.max(1, stage.width * 0.5),
    -1,
    1,
  );
  const volume = 0.52 / (1 + distance / (scale * 0.42));

  audio.oscillator.frequency.setTargetAtTime(
    BASE_AUDIO_HZ * ratio,
    now,
    0.035,
  );
  audio.gain.gain.setTargetAtTime(volume, now, 0.06);
  audio.pan.pan.setTargetAtTime(stereo, now, 0.06);
}

function startAudio(stage: Stage): boolean {
  if (audio) return true;

  let context: AudioContext | null = null;

  try {
    context = new AudioContext();

    const oscillator = context.createOscillator();
    const pan = context.createStereoPanner();
    const gain = context.createGain();
    const master = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = BASE_AUDIO_HZ;
    gain.gain.value = 0;
    master.gain.value = 0.055;

    oscillator.connect(pan);
    pan.connect(gain);
    gain.connect(master);
    master.connect(context.destination);
    oscillator.start();

    const current = context;
    audio = { context, oscillator, gain, pan };
    syncAudio(stage);

    void context.resume().catch(() => {
      if (audio?.context === current) stopAudio();
    });

    return true;
  } catch {
    if (context) void context.close().catch(() => {});
    audio = null;
    return false;
  }
}

function toggleAudio(env: RoomEnvironment): void {
  if (audio) {
    stopAudio();
    env.setStatus("doppler / sound off");
  } else {
    env.setStatus(
      startAudio(env.stage)
        ? "doppler / sound awake"
        : "doppler / visual only",
    );
  }
}

function drawWavefronts(stage: Stage): void {
  const { ctx } = stage;
  const scale = scaleFor(stage);
  const maxRadius =
    Math.hypot(stage.width, stage.height) / scale + 0.2;

  ctx.save();
  ctx.lineWidth = 1;

  for (const front of wavefronts) {
    const x = front.u * stage.width;
    const y = front.v * stage.height;
    const radius = front.radius * scale;
    const fade = clamp(1 - front.radius / maxRadius, 0, 1);

    ctx.strokeStyle = `rgba(184,218,255,${(0.06 + fade * 0.24).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSource(stage: Stage): void {
  const { ctx } = stage;
  const source = sourcePoint(stage);

  stage.glow(
    source.x,
    source.y,
    stage.width < 680 ? 36 : 48,
    "rgba(255,203,142,0.24)",
    "rgba(255,160,74,0)",
  );

  ctx.save();
  ctx.translate(source.x, source.y);

  ctx.fillStyle = "rgba(255,225,185,0.94)";
  ctx.beginPath();
  ctx.arc(0, 0, stage.width < 680 ? 5 : 6.5, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,237,213,0.48)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, stage.width < 680 ? 13 : 16, 0, TAU);
  ctx.stroke();

  const arrow = direction * (stage.width < 680 ? 14 : 18);
  ctx.beginPath();
  ctx.moveTo(-arrow * 0.35, 0);
  ctx.lineTo(arrow, 0);
  ctx.lineTo(arrow - direction * 5, -4);
  ctx.moveTo(arrow, 0);
  ctx.lineTo(arrow - direction * 5, 4);
  ctx.stroke();

  ctx.restore();
}

function drawListener(stage: Stage): void {
  const { ctx } = stage;
  const ear = listenerPoint(stage);
  const pulse = listenerFlash;

  if (pulse > 0.03) {
    ctx.strokeStyle = `rgba(255,238,194,${(pulse * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ear.x, ear.y, 13 + (1 - pulse) * 28, 0, TAU);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(235,245,255,0.62)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ear.x, ear.y, 10, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = "rgba(242,248,255,0.88)";
  ctx.beginPath();
  ctx.arc(ear.x, ear.y, 2.2, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(235,245,255,0.24)";
  ctx.beginPath();
  ctx.moveTo(ear.x - 16, ear.y);
  ctx.lineTo(ear.x - 11, ear.y);
  ctx.moveTo(ear.x + 11, ear.y);
  ctx.lineTo(ear.x + 16, ear.y);
  ctx.stroke();
}

function drawSoundButton(stage: Stage): void {
  const { ctx } = stage;
  const point = soundButton(stage);

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 32, 0, TAU);
  ctx.fillStyle = audio
    ? "rgba(255,201,135,0.14)"
    : "rgba(8,12,25,0.74)";
  ctx.fill();
  ctx.strokeStyle = audio
    ? "rgba(255,225,181,0.76)"
    : "rgba(210,222,255,0.34)";
  ctx.stroke();

  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = audio ? "#ffe2bb" : "#bec8df";
  ctx.fillText("SOUND", point.x, point.y - 2);
  ctx.fillText(audio ? "ON" : "OFF", point.x, point.y + 12);
  ctx.restore();
}

function motionLabel(stage: Stage): string {
  const radial = radialMotion(stage);

  if (Math.abs(radial) < 0.025) return "TRANSVERSE";
  return radial > 0 ? "APPROACHING" : "RECEDING";
}

if (wavefronts.length === 0) emitWavefront();

export const dopplerRoom: RoomModule = {
  id: "doppler",
  title: "XXI · Doppler",
  copy: "The source keeps one note. Motion changes what arrives.",
  hint:
    "click to place listener · SOUND / A toggles audio · Space pause · R restore",

  enter({ setStatus }): void {
    setStatus("doppler / source 220 Hz · sound off");
  },

  exit(): void {
    stopAudio();
  },

  resize({ stage }): void {
    rearmWavefronts(stage);
    syncAudio(stage);
  },

  draw({ stage }, dt): void {
    const dtSeconds = Math.min(dt, 32) / 1000;
    simulate(stage, dtSeconds);
    listenerFlash *= Math.exp(-Math.min(dt, 32) / 180);

    stage.clear("#03050a");
    stage.drawStars(0.035);

    const { ctx, width, height } = stage;
    const y = SOURCE_V * height;
    const left = SOURCE_MIN_U * width;
    const right = SOURCE_MAX_U * width;

    ctx.strokeStyle = "rgba(215,228,255,0.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(215,228,255,0.18)";
    ctx.beginPath();
    ctx.arc(left, y, 2, 0, TAU);
    ctx.arc(right, y, 2, 0, TAU);
    ctx.fill();

    drawWavefronts(stage);
    drawSource(stage);
    drawListener(stage);
    drawSoundButton(stage);
    syncAudio(stage);

    const ratio = observedRatio(stage);
    const heard = BASE_AUDIO_HZ * ratio;
    const labelY = Math.min(height - 66, y + Math.min(210, height * 0.28));

    ctx.textAlign = "center";
    ctx.font =
      "500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle =
      Math.abs(ratio - 1) > 0.04
        ? "rgba(255,225,184,0.78)"
        : "rgba(232,240,255,0.42)";
    ctx.fillText(
      motionLabel(stage) === "APPROACHING"
        ? "Wavefronts arrive closer together."
        : motionLabel(stage) === "RECEDING"
          ? "Wavefronts arrive farther apart."
          : "Sideways motion barely shifts the arrivals.",
      width / 2,
      labelY,
    );

    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,240,255,0.25)";
    ctx.fillText(
      `SOURCE ${BASE_AUDIO_HZ} Hz · ARRIVAL ${heard.toFixed(1)} Hz · ${motionLabel(stage)}${paused ? " · PAUSED" : ""}`,
      width / 2,
      labelY + 23,
    );
  },

  click(env, x, y): void {
    const { stage, setStatus } = env;
    const button = soundButton(stage);

    if (Math.hypot(x - button.x, y - button.y) <= 40) {
      toggleAudio(env);
      return;
    }

    listener = {
      u: clamp(x / Math.max(1, stage.width), 0.06, 0.94),
      v: clamp(y / Math.max(1, stage.height), 0.16, 0.82),
    };
    rearmWavefronts(stage);
    syncAudio(stage);
    setStatus("doppler / listener moved");
  },

  key(env, event): void {
    const key = event.key.toLowerCase();

    if (
      key === "a" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      toggleAudio(env);
      return;
    }

    if (key === "r") {
      reset();
      rearmWavefronts(env.stage);
      syncAudio(env.stage);
      env.setStatus("doppler / canonical motion restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      syncAudio(env.stage);
      env.setStatus(paused ? "doppler / paused" : "doppler / moving");
    }
  },
};
