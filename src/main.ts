import "./style.css";

import type { RoomEnvironment, RoomId, RoomModule } from "./core/room";
import { Stage } from "./core/stage";
import { createAtriumRoom } from "./rooms/atrium";
import { bloomRoom } from "./rooms/bloom";
import { chaosRoom } from "./rooms/chaos";
import { echoRoom } from "./rooms/echo";
import { gravitasRoom } from "./rooms/gravitas";
import { moireRoom } from "./rooms/moire";
import { phaseRoom } from "./rooms/phase";
import { polarityRoom } from "./rooms/polarity";
import { murmurationRoom } from "./rooms/murmuration";
import { myceliumRoom } from "./rooms/mycelium";
import { prismRoom } from "./rooms/prism";
import { reactionRoom } from "./rooms/reaction";
import { resonanceRoom } from "./rooms/resonance";
import { territoryRoom } from "./rooms/territory";
import { thresholdRoom } from "./rooms/threshold";
import { hysteresisRoom } from "./rooms/hysteresis";
import { phantomRoom } from "./rooms/phantom";
import { traceRoom } from "./rooms/trace";
import { avalancheRoom } from "./rooms/avalanche";
import { elsewhenRoom } from "./rooms/elsewhen";
import { dopplerRoom } from "./rooms/doppler";
import { aliasRoom } from "./rooms/alias";
import { driftRoom } from "./rooms/drift";
import { repriseRoom } from "./rooms/reprise";
import { causticRoom } from "./rooms/caustic";
import { monodromyRoom } from "./rooms/monodromy";
import { tidesRoom } from "./rooms/tides-room";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Solarium could not find its mount point.");

const targetRooms: RoomModule[] = [
  gravitasRoom,
  bloomRoom,
  resonanceRoom,
  murmurationRoom,
  myceliumRoom,
  tidesRoom,
  reactionRoom,
  prismRoom,
  chaosRoom,
  echoRoom,
  moireRoom,
  phaseRoom,
  polarityRoom,
  territoryRoom,
  thresholdRoom,
  hysteresisRoom,
  phantomRoom,
  traceRoom,
  avalancheRoom,
  elsewhenRoom,
  dopplerRoom,
  aliasRoom,
  driftRoom,
  repriseRoom,
  causticRoom,
  monodromyRoom,
];

const atriumRoom = createAtriumRoom(targetRooms);
const rooms: RoomModule[] = [atriumRoom, ...targetRooms];
const roomById = new Map<RoomId, RoomModule>(
  rooms.map((room) => [room.id, room]),
);

app.innerHTML = `
  <canvas
    id="stage"
    tabindex="0"
    aria-label="Interactive Solarium canvas"
    aria-describedby="stage-help"
  ></canvas>
  <p class="sr-only" id="stage-help">
    Focus the stage, use arrow keys to move the virtual cursor, and press Enter to activate the current point.
    Space also activates unless the current room already uses Space for its own control.
  </p>
  <div class="shell" data-room="atrium">
    <div class="brand"><strong>SOLARIUM</strong><span>024 / MONODROMY</span></div>
    <div class="atrium-kicker" aria-hidden="true">local-first / ${targetRooms.length} anomalies</div>
    <div class="atrium-motto" aria-hidden="true">enter nothing<br />leave different</div>
    <p class="atrium-copy" aria-hidden="true">${atriumRoom.copy}</p>
    <section class="room-meta" aria-live="polite">
      <h1 id="room-title">${atriumRoom.title}</h1>
      <p id="room-copy">${atriumRoom.copy}</p>
    </section>
    <button class="back" id="back" type="button" hidden>← Atrium</button>
    <div class="hint" id="hint">${atriumRoom.hint}</div>
    <div class="status" id="status">local / awake</div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
const titleEl = document.querySelector<HTMLElement>("#room-title");
const copyEl = document.querySelector<HTMLElement>("#room-copy");
const hintEl = document.querySelector<HTMLElement>("#hint");
const statusEl = document.querySelector<HTMLElement>("#status");
const backEl = document.querySelector<HTMLButtonElement>("#back");
const shellEl = document.querySelector<HTMLElement>(".shell");

if (!canvas || !titleEl || !copyEl || !hintEl || !statusEl || !backEl || !shellEl) {
  throw new Error("Solarium interface failed to initialize.");
}

const stage = new Stage(canvas);
let currentRoom: RoomId = "atrium";
let keyboardControl = false;

function readVisitedRooms(): RoomId[] {
  try {
    return (localStorage.getItem("solarium.visited") ?? "")
      .split(",")
      .filter(Boolean) as RoomId[];
  } catch {
    return [];
  }
}

const visited = new Set<RoomId>(readVisitedRooms());

function setStatus(text: string): void {
  statusEl.textContent = text;
  statusEl.classList.remove("flash");
  void statusEl.offsetWidth;
  statusEl.classList.add("flash");
}

const env: RoomEnvironment = {
  stage,
  visited,
  setStatus,
};

function persistVisit(target: RoomId): void {
  visited.add(target);

  try {
    localStorage.setItem("solarium.visited", [...visited].join(","));
  } catch {
    // The in-memory visit trail still works when browser storage is unavailable.
  }
}

function enterRoom(target: RoomId): void {
  const next = roomById.get(target);
  if (!next) return;

  if (currentRoom !== target) roomById.get(currentRoom)?.exit?.(env);
  currentRoom = target;
  shellEl.dataset.room = target;
  titleEl.textContent = next.title;
  copyEl.textContent = next.copy;
  hintEl.textContent = next.hint;
  backEl.hidden = target === "atrium";

  persistVisit(target);
  setStatus("local / awake");
  next.enter?.(env);
}

function resize(): void {
  stage.resize();
  for (const room of targetRooms) room.resize?.(env);
}

function handleCanvasClick(x: number, y: number): void {
  const active = roomById.get(currentRoom);
  const target = active?.click?.(env, x, y);
  if (target) enterRoom(target);
}

canvas.addEventListener("pointermove", (event) => {
  keyboardControl = false;
  const point = stage.pointFromEvent(event);
  stage.pointer.x = point.x;
  stage.pointer.y = point.y;
  stage.pointer.active = true;
});

canvas.addEventListener("pointerdown", (event) => {
  keyboardControl = false;
  const point = stage.pointFromEvent(event);
  stage.pointer.x = point.x;
  stage.pointer.y = point.y;
  stage.pointer.down = true;
  stage.pointer.active = true;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  const point = stage.pointFromEvent(event);
  stage.pointer.down = false;
  handleCanvasClick(point.x, point.y);

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
});

function releasePointer(): void {
  keyboardControl = false;
  stage.pointer.active = false;
  stage.pointer.down = false;
}

function cancelPointer(event: PointerEvent): void {
  releasePointer();

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function engageKeyboardControl(): void {
  if (!keyboardControl || !stage.pointer.active) {
    stage.pointer.x = stage.width / 2;
    stage.pointer.y = stage.height / 2;
    stage.pointer.active = true;
    stage.pointer.down = false;
    setStatus("keyboard / arrows move · enter activates");
  }

  keyboardControl = true;
}

function moveKeyboardCursor(dx: number, dy: number): void {
  engageKeyboardControl();
  stage.pointer.x = Math.max(12, Math.min(stage.width - 12, stage.pointer.x + dx));
  stage.pointer.y = Math.max(12, Math.min(stage.height - 12, stage.pointer.y + dy));
}

canvas.addEventListener("pointerleave", releasePointer);
canvas.addEventListener("pointercancel", cancelPointer);
window.addEventListener("blur", () => {
  releasePointer();
  roomById.get(currentRoom)?.exit?.(env);
});

backEl.addEventListener("click", () => enterRoom("atrium"));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    enterRoom("atrium");
    return;
  }

  // 1–9 are quick shortcuts, not an implied multi-digit numbering scheme.
  // Every room remains reachable through the stage's shared cursor/click path.
  if (
    currentRoom === "atrium" &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    /^[1-9]$/.test(event.key)
  ) {
    const index = Number(event.key) - 1;
    if (index < Math.min(targetRooms.length, 9)) {
      event.preventDefault();
      enterRoom(targetRooms[index].id);
      return;
    }
  }

  const activeRoom = roomById.get(currentRoom);
  activeRoom?.key?.(env, event);

  if (event.defaultPrevented || document.activeElement !== canvas) return;

  const step = event.shiftKey ? 64 : 26;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveKeyboardCursor(-step, 0);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveKeyboardCursor(step, 0);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveKeyboardCursor(0, -step);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveKeyboardCursor(0, step);
    return;
  }

  if (event.key === "Enter" || event.code === "Space") {
    event.preventDefault();
    engageKeyboardControl();
    handleCanvasClick(stage.pointer.x, stage.pointer.y);
  }
});

window.addEventListener("resize", resize);

let previous = performance.now();
let frameHandle = 0;
let lastReducedMotionFrame = 0;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function frame(now: number): void {
  if (reducedMotion.matches && now - lastReducedMotionFrame < 100) {
    frameHandle = requestAnimationFrame(frame);
    return;
  }

  const dt = reducedMotion.matches ? Math.min(now - previous, 16) : Math.min(now - previous, 32);
  previous = now;
  lastReducedMotionFrame = now;
  stage.time = now;

  roomById.get(currentRoom)?.draw(env, dt);

  if (keyboardControl && document.activeElement === canvas) {
    stage.drawKeyboardReticle();
  }

  frameHandle = requestAnimationFrame(frame);
}

function startAnimation(): void {
  if (frameHandle) return;
  previous = performance.now();
  frameHandle = requestAnimationFrame(frame);
}

function stopAnimation(): void {
  roomById.get(currentRoom)?.exit?.(env);
  if (!frameHandle) return;
  cancelAnimationFrame(frameHandle);
  frameHandle = 0;
  releasePointer();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAnimation();
  else startAnimation();
});

reducedMotion.addEventListener("change", () => {
  previous = performance.now();
  lastReducedMotionFrame = 0;
});

resize();
stage.clear("#050509");
enterRoom("atrium");
startAnimation();
