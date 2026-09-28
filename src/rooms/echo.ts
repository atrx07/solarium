import type { RoomModule } from "../core/room";
import type { Stage } from "../core/stage";
import { TAU, clamp } from "../core/stage";

type Source = { u: number; v: number };
type Voice = { oscillator: OscillatorNode; gain: GainNode; pan: StereoPannerNode };
type AudioGraph = { context: AudioContext; master: GainNode; voices: Voice[] };

const MAX_SOURCES = 4;
const AUDIO_FREQUENCIES = [110, 111.7, 165, 166.4];
const VISUAL_RATES = [1.07, 1.19, 1.61, 1.73];
const sourcePalette = ["#a2e9ff", "#ffd8e9", "#b6c9ff", "#e5dfae"];
const initialSources: Source[] = [{ u: 0.34, v: 0.42 }, { u: 0.68, v: 0.57 }];

let sources: Source[] = initialSources.map((s) => ({ ...s }));
let selected: number | null = null;
let phaseSeconds = 0;
let paused = false;
let dirty = true;
let audio: AudioGraph | null = null;

const buffer = document.createElement("canvas");
const bufferCtx = buffer.getContext("2d");
if (!bufferCtx) throw new Error("Echo needs Canvas 2D.");
let image = bufferCtx.createImageData(1, 1);
let fieldWidth = 1;
let fieldHeight = 1;

function reset(): void {
  sources = initialSources.map((s) => ({ ...s }));
  selected = null;
  phaseSeconds = 0;
  paused = false;
  dirty = true;
}

function resizeField(stage: Stage): void {
  fieldWidth = Math.max(1, stage.width);
  fieldHeight = Math.max(1, stage.height);
  // ~16k samples irrespective of screen size: inexpensive on phones and HiDPI displays.
  const cell = Math.max(5, Math.sqrt((fieldWidth * fieldHeight) / 16000));
  buffer.width = Math.max(24, Math.ceil(fieldWidth / cell));
  buffer.height = Math.max(24, Math.ceil(fieldHeight / cell));
  image = bufferCtx!.createImageData(buffer.width, buffer.height);
  dirty = true;
}

function soundButton(stage: Stage): { x: number; y: number } {
  return { x: stage.width - 65, y: Math.max(157, stage.height - 122) };
}

function sourcePoint(stage: Stage, source: Source): { x: number; y: number } {
  return { x: source.u * stage.width, y: source.v * stage.height };
}

function listenerPoint(stage: Stage): { x: number; y: number } {
  return stage.pointer.active
    ? { x: stage.pointer.x, y: stage.pointer.y }
    : { x: stage.width * 0.5, y: stage.height * 0.52 };
}

function stopAudio(): void {
  const current = audio;
  audio = null;
  if (!current) return;

  for (const voice of current.voices) {
    try { voice.oscillator.stop(); } catch { /* Already stopped. */ }
  }
  void current.context.close().catch(() => { /* Audio is optional. */ });
}

function syncAudio(stage: Stage): void {
  if (!audio || audio.context.state === "closed") return;
  const { context, voices } = audio;
  const now = context.currentTime;
  const listener = listenerPoint(stage);
  const scale = Math.max(1, Math.min(stage.width, stage.height));

  voices.forEach((voice, index) => {
    const source = sources[index];
    if (!source) {
      voice.gain.gain.setTargetAtTime(0, now, 0.045);
      return;
    }
    const position = sourcePoint(stage, source);
    const distance = Math.hypot(position.x - listener.x, position.y - listener.y);
    const volume = 0.52 / (1 + distance / (scale * 0.39));
    const stereo = clamp((position.x - listener.x) / (stage.width * 0.5), -1, 1);
    voice.gain.gain.setTargetAtTime(volume, now, 0.07);
    voice.pan.pan.setTargetAtTime(stereo, now, 0.07);
  });
}

function startAudio(stage: Stage): boolean {
  if (audio) return true;
  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0.042;
    master.connect(context.destination);

    const voices = AUDIO_FREQUENCIES.map((frequency) => {
      const oscillator = context!.createOscillator();
      const pan = context!.createStereoPanner();
      const gain = context!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0;
      oscillator.connect(pan);
      pan.connect(gain);
      gain.connect(master);
      oscillator.start();
      return { oscillator, pan, gain };
    });

    const current = context;
    audio = { context, master, voices };
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

function toggleAudio(env: Parameters<NonNullable<RoomModule["click"]>>[0]): void {
  if (audio) {
    stopAudio();
    env.setStatus("echo / sound off");
  } else {
    env.setStatus(startAudio(env.stage) ? "echo / sound awake" : "echo / visual only");
  }
}

function paintField(): void {
  const pixels = image.data;
  const cols = buffer.width;
  const rows = buffer.height;
  const scale = Math.min(fieldWidth, fieldHeight);
  let offset = 0;

  for (let y = 0; y < rows; y += 1) {
    const py = ((y + 0.5) / rows) * fieldHeight;
    for (let x = 0; x < cols; x += 1) {
      const px = ((x + 0.5) / cols) * fieldWidth;
      let pressure = 0;
      let weightSum = 0;

      for (let i = 0; i < sources.length; i += 1) {
        const source = sources[i];
        const distance = Math.hypot(px - source.u * fieldWidth, py - source.v * fieldHeight);
        const attenuation = 1 / Math.sqrt(1 + distance / (scale * 0.14));
        const cycles = (distance / (scale * 0.16)) * (AUDIO_FREQUENCIES[i] / 110);
        pressure += attenuation * Math.sin(TAU * (phaseSeconds * VISUAL_RATES[i] - cycles));
        weightSum += attenuation;
      }

      const value = clamp(pressure / Math.max(weightSum, 0.001), -1, 1);
      const light = Math.abs(value);
      const positive = Math.max(value, 0);
      const negative = Math.max(-value, 0);

      pixels[offset] = Math.round(5 + light * 57 + negative * 35);
      pixels[offset + 1] = Math.round(10 + light * 97 + positive * 45);
      pixels[offset + 2] = Math.round(24 + light * 145 + negative * 31);
      pixels[offset + 3] = 255;
      offset += 4;
    }
  }

  bufferCtx!.putImageData(image, 0, 0);
  dirty = false;
}

function drawSources(stage: Stage): void {
  const ctx = stage.ctx;
  sources.forEach((source, index) => {
    const point = sourcePoint(stage, source);
    const isSelected = selected === index;
    stage.glow(point.x, point.y, isSelected ? 54 : 37,
      "rgba(201,232,255,0.32)", "rgba(90,115,220,0)");
    ctx.beginPath();
    ctx.arc(point.x, point.y, isSelected ? 12 : 7, 0, TAU);
    ctx.fillStyle = sourcePalette[index];
    ctx.fill();
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255,255,255,0.44)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, isSelected ? 22 : 15, 0, TAU);
    ctx.stroke();
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(245,247,255,0.75)";
    ctx.fillText(String(index + 1).padStart(2, "0"), point.x, point.y - 25);
  });
}

function drawAudioButton(stage: Stage): void {
  const ctx = stage.ctx;
  const point = soundButton(stage);
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 33, 0, TAU);
  ctx.fillStyle = audio ? "rgba(102,208,230,0.21)" : "rgba(8,12,25,0.74)";
  ctx.fill();
  ctx.strokeStyle = audio ? "rgba(164,243,255,0.8)" : "rgba(210,222,255,0.37)";
  ctx.stroke();
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = audio ? "#c3f8ff" : "#bec8df";
  ctx.fillText("SOUND", point.x, point.y - 2);
  ctx.fillText(audio ? "ON" : "OFF", point.x, point.y + 12);
  ctx.restore();
}

export const echoRoom: RoomModule = {
  id: "echo",
  title: "X · Echo",
  copy: "Put two voices in the dark. Between them, silence draws its own geometry.",
  hint: "tap to add (max 4) · tap node then destination to move · SOUND / A toggles audio · R resets",

  enter({ setStatus }): void {
    setStatus("echo / visual · sound off");
  },

  exit(): void {
    stopAudio();
    selected = null;
  },

  resize({ stage }): void {
    resizeField(stage);
    syncAudio(stage);
  },

  draw({ stage }, dt): void {
    if (!paused) {
      phaseSeconds += Math.min(dt, 32) / 1000;
      dirty = true;
    }
    if (dirty) paintField();

    stage.clear("#030711");
    stage.ctx.save();
    stage.ctx.imageSmoothingEnabled = true;
    stage.ctx.drawImage(buffer, 0, 0, stage.width, stage.height);
    stage.ctx.restore();

    const ctx = stage.ctx;
    const listener = listenerPoint(stage);
    ctx.beginPath();
    ctx.arc(listener.x, listener.y, 11, 0, TAU);
    ctx.strokeStyle = "rgba(246,250,255,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(listener.x, listener.y, 2, 0, TAU);
    ctx.fillStyle = "rgba(246,250,255,0.8)";
    ctx.fill();

    drawSources(stage);
    drawAudioButton(stage);
    syncAudio(stage);

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(240,245,255,0.62)";
    ctx.fillText(
      String(sources.length) + " VOICES / " + (paused ? "FIELD FROZEN" : "INTERFERENCE LIVE"),
      25, stage.height - 111,
    );
    if (selected !== null) {
      ctx.fillText("SOURCE " + (selected + 1) + " / CHOOSE DESTINATION", 25, stage.height - 92);
    }
  },

  click(env, x, y): void {
    const { stage, setStatus } = env;
    const button = soundButton(stage);
    if (Math.hypot(x - button.x, y - button.y) <= 40) {
      toggleAudio(env);
      return;
    }

    const nearby = sources.findIndex((source) => {
      const point = sourcePoint(stage, source);
      return Math.hypot(x - point.x, y - point.y) <= 32;
    });

    if (nearby >= 0) {
      selected = selected === nearby ? null : nearby;
      setStatus(selected === null ? "echo / selection cleared" : "echo / select destination");
      return;
    }

    const position = {
      u: clamp(x / Math.max(stage.width, 1), 0.07, 0.93),
      v: clamp(y / Math.max(stage.height, 1), 0.18, 0.82),
    };

    if (selected !== null) {
      sources[selected] = position;
      selected = null;
      setStatus("echo / source moved");
    } else if (sources.length < MAX_SOURCES) {
      sources.push(position);
      setStatus("echo / voice added");
    } else {
      setStatus("echo / four voices · select one to move");
      return;
    }
    dirty = true;
    syncAudio(stage);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "a" && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      toggleAudio(env);
      return;
    }
    if (event.key.toLowerCase() === "r") {
      reset();
      syncAudio(env.stage);
      env.setStatus("echo / sources restored");
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "echo / field frozen" : "echo / field awake");
    }
  },
};
