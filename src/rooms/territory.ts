import type { RoomModule } from "../core/room";
import { TAU, clamp } from "../core/stage";

type Site = {
  u: number;
  v: number;
  du: number;
  dv: number;
  hue: number;
};

const BASE_COUNT = 12;
const MAX_SITES = 24;
const SAMPLE_STEP = 7;

let sites: Site[] = [];
let paused = false;
let elapsed = 0;

function deterministicSite(index: number): Site {
  const angle = index * 2.399963229728653;
  const radius = 0.11 + (index % 4) * 0.055;
  const u = clamp(0.5 + Math.cos(angle) * radius * 1.7, 0.08, 0.92);
  const v = clamp(0.5 + Math.sin(angle) * radius, 0.15, 0.85);

  return {
    u,
    v,
    du: Math.cos(angle * 1.71 + 0.4) * (0.006 + (index % 3) * 0.0018),
    dv: Math.sin(angle * 1.31 - 0.7) * (0.005 + (index % 4) * 0.0014),
    hue: 185 + ((index * 47) % 145),
  };
}

function reset(): void {
  sites = Array.from({ length: BASE_COUNT }, (_, index) => deterministicSite(index));
  paused = false;
  elapsed = 0;
}

function removeNearbySite(
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  let target = -1;
  let best = 26;

  sites.forEach((site, index) => {
    const distance = Math.hypot(site.u * width - x, site.v * height - y);
    if (distance < best) {
      best = distance;
      target = index;
    }
  });

  if (target < 0) return false;
  sites.splice(target, 1);
  return true;
}

function addSite(width: number, height: number, x: number, y: number): void {
  const index = sites.length;
  const angle = index * 1.618 + x * 0.006 - y * 0.004;

  sites.push({
    u: clamp(x / Math.max(width, 1), 0.05, 0.95),
    v: clamp(y / Math.max(height, 1), 0.1, 0.9),
    du: Math.cos(angle) * 0.007,
    dv: Math.sin(angle * 1.27) * 0.006,
    hue: 185 + ((index * 53 + Math.floor(x + y)) % 145),
  });
}

function advance(dtSeconds: number): void {
  if (paused) return;

  elapsed += dtSeconds;

  for (const site of sites) {
    site.u += site.du * dtSeconds;
    site.v += site.dv * dtSeconds;

    if (site.u < 0.05) {
      site.u = 0.05;
      site.du = Math.abs(site.du);
    } else if (site.u > 0.95) {
      site.u = 0.95;
      site.du = -Math.abs(site.du);
    }

    if (site.v < 0.11) {
      site.v = 0.11;
      site.dv = Math.abs(site.dv);
    } else if (site.v > 0.89) {
      site.v = 0.89;
      site.dv = -Math.abs(site.dv);
    }
  }
}

function siteColor(hue: number, alpha: number, lightness: number): string {
  return `hsla(${hue.toFixed(1)}, 58%, ${lightness.toFixed(1)}%, ${alpha})`;
}

function drawTerritoryField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pointerActive: boolean,
  pointerX: number,
  pointerY: number,
): void {
  if (sites.length === 0 && !pointerActive) return;

  const step = SAMPLE_STEP;
  const pointerHue = 46;

  for (let y = step * 0.5; y < height; y += step) {
    for (let x = step * 0.5; x < width; x += step) {
      let winner = -1;
      let best = Infinity;

      sites.forEach((site, index) => {
        const dx = site.u * width - x;
        const dy = site.v * height - y;
        const d2 = dx * dx + dy * dy;

        if (d2 < best) {
          best = d2;
          winner = index;
        }
      });

      let ghostWins = false;
      if (pointerActive) {
        const dx = pointerX - x;
        const dy = pointerY - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) {
          best = d2;
          ghostWins = true;
        }
      }

      const distance = Math.sqrt(best);
      const fade = clamp(1 - distance / Math.max(Math.min(width, height) * 0.42, 1), 0.18, 1);
      const hue = ghostWins
        ? pointerHue
        : sites[winner]?.hue ?? 210;

      ctx.fillStyle = siteColor(hue, 0.12 + fade * 0.16, 54 + fade * 8);
      ctx.fillRect(x - step * 0.5, y - step * 0.5, step + 1, step + 1);
    }
  }
}

function drawBorders(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pointerActive: boolean,
  pointerX: number,
  pointerY: number,
): void {
  const step = 14;

  function ownerAt(x: number, y: number): number {
    let owner = -1;
    let best = Infinity;

    sites.forEach((site, index) => {
      const dx = site.u * width - x;
      const dy = site.v * height - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < best) {
        best = d2;
        owner = index;
      }
    });

    if (pointerActive) {
      const dx = pointerX - x;
      const dy = pointerY - y;
      if (dx * dx + dy * dy < best) owner = sites.length;
    }

    return owner;
  }

  ctx.save();
  ctx.strokeStyle = "rgba(220,232,255,0.14)";
  ctx.lineWidth = 1;

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const owner = ownerAt(x, y);
      const right = ownerAt(x + step, y);
      const down = ownerAt(x, y + step);

      if (owner !== right) {
        ctx.beginPath();
        ctx.moveTo(x + step * 0.5, y - step * 0.45);
        ctx.lineTo(x + step * 0.5, y + step * 0.45);
        ctx.stroke();
      }

      if (owner !== down) {
        ctx.beginPath();
        ctx.moveTo(x - step * 0.45, y + step * 0.5);
        ctx.lineTo(x + step * 0.45, y + step * 0.5);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawSites(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
): void {
  sites.forEach((site, index) => {
    const x = site.u * width;
    const y = site.v * height;
    const pulse = 1 + Math.sin(time * 0.0017 + index * 0.83) * 0.09;

    ctx.save();
    ctx.strokeStyle = siteColor(site.hue, 0.68, 78);
    ctx.fillStyle = siteColor(site.hue, 0.18, 62);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 5.5 * pulse, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = siteColor(site.hue, 0.9, 84);
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  });
}

if (sites.length === 0) reset();

export const territoryRoom: RoomModule = {
  id: "territory",
  title: "XIV · Territory",
  copy: "No walls were drawn. Proximity drew them anyway.",
  hint:
    "move to claim temporary space · click empty space plants seed · click seed removes it · Space pauses · R resets",

  enter({ setStatus }): void {
    setStatus("territory / borders negotiating");
  },

  draw({ stage }, dt): void {
    advance(Math.min(dt, 32) / 1000);

    const { ctx, width, height } = stage;
    stage.clear("#03050a");
    stage.drawStars(0.08);

    drawTerritoryField(
      ctx,
      width,
      height,
      stage.pointer.active,
      stage.pointer.x,
      stage.pointer.y,
    );
    drawBorders(
      ctx,
      width,
      height,
      stage.pointer.active,
      stage.pointer.x,
      stage.pointer.y,
    );
    drawSites(ctx, width, height, elapsed * 1000);

    if (stage.pointer.active) {
      const ghostPulse = 8 + Math.sin(elapsed * 3.6) * 1.7;
      ctx.save();
      ctx.strokeStyle = "rgba(255,230,150,0.72)";
      ctx.fillStyle = "rgba(255,224,127,0.15)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(stage.pointer.x, stage.pointer.y, ghostPulse, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,237,185,0.72)";
      ctx.fillText("YOU", stage.pointer.x, stage.pointer.y - 14);
      ctx.restore();
    }

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(232,240,255,0.48)";
    ctx.fillText(
      `${sites.length} SEEDS / ${paused ? "BORDERS FROZEN" : "BORDERS DRIFTING"} / POINTER = TEMPORARY CLAIM`,
      28,
      height - 74,
    );
  },

  click({ stage, setStatus }, x, y): void {
    if (removeNearbySite(stage.width, stage.height, x, y)) {
      setStatus("territory / seed removed · borders redrawn");
      return;
    }

    if (sites.length >= MAX_SITES) {
      setStatus("territory / twenty-four seeds · remove one first");
      return;
    }

    addSite(stage.width, stage.height, x, y);
    setStatus("territory / seed planted");
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      reset();
      env.setStatus("territory / original borders restored");
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      paused = !paused;
      env.setStatus(paused ? "territory / borders frozen" : "territory / borders drifting");
    }
  },
};
