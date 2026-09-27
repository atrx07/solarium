import "./style.css";

import type { RoomEnvironment, RoomId, RoomModule } from "./core/room";
import { Stage } from "./core/stage";
import { createAtriumRoom } from "./rooms/atrium";
import { bloomRoom } from "./rooms/bloom";
import { gravitasRoom } from "./rooms/gravitas";
import { murmurationRoom } from "./rooms/murmuration";
import { myceliumRoom } from "./rooms/mycelium";
import { reactionRoom } from "./rooms/reaction";
import { resonanceRoom } from "./rooms/resonance";
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
];

const atriumRoom = createAtriumRoom(targetRooms);
const rooms: RoomModule[] = [atriumRoom, ...targetRooms];
const roomById = new Map<RoomId, RoomModule>(
  rooms.map((room) => [room.id, room]),
);

app.innerHTML = `
  <canvas id="stage" aria-label="Interactive Solarium canvas"></canvas>
  <div class="shell">
    <div class="brand"><strong>SOLARIUM</strong><span>005 / REACTION</span></div>
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

if (!canvas || !titleEl || !copyEl || !hintEl || !statusEl || !backEl) {
  throw new Error("Solarium interface failed to initialize.");
}

const stage = new Stage(canvas);
let currentRoom: RoomId = "atrium";

const visited = new Set<RoomId>(
  ((localStorage.getItem("solarium.visited") ?? "")
    .split(",")
    .filter(Boolean) as RoomId[]),
);

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
  localStorage.setItem("solarium.visited", [...visited].join(","));
}

function enterRoom(target: RoomId): void {
  const next = roomById.get(target);
  if (!next) return;

  currentRoom = target;
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
  const point = stage.pointFromEvent(event);
  stage.pointer.x = point.x;
  stage.pointer.y = point.y;
  stage.pointer.active = true;
});

canvas.addEventListener("pointerdown", (event) => {
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

canvas.addEventListener("pointerleave", () => {
  stage.pointer.active = false;
  stage.pointer.down = false;
});

backEl.addEventListener("click", () => enterRoom("atrium"));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    enterRoom("atrium");
    return;
  }

  if (currentRoom === "atrium") {
    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < targetRooms.length) {
      enterRoom(targetRooms[index].id);
      return;
    }
  }

  roomById.get(currentRoom)?.key?.(env, event);
});

window.addEventListener("resize", resize);

let previous = performance.now();

function frame(now: number): void {
  const dt = Math.min(now - previous, 32);
  previous = now;
  stage.time = now;

  roomById.get(currentRoom)?.draw(env, dt);
  requestAnimationFrame(frame);
}

resize();
stage.clear("#050509");
enterRoom("atrium");
requestAnimationFrame(frame);
