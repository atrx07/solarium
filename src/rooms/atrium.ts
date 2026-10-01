import type { RoomEnvironment, RoomId, RoomModule } from "../core/room";
import { TAU, dist } from "../core/stage";

type OrbitNode = {
  room: RoomId;
  title: string;
  x: number;
  y: number;
  r: number;
  ring: number;
  depth: number;
  scale: number;
  hue: number;
};

type OrbitRing = {
  count: number;
  radiusX: number;
  radiusDepth: number;
  speed: number;
  phase: number;
  tilt: number;
  orientation: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  scale: number;
};

export function createAtriumRoom(targets: RoomModule[]): RoomModule {
  const countWords = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  const rawCount = countWords[targets.length] ?? String(targets.length);
  const countLabel = rawCount.charAt(0).toUpperCase() + rawCount.slice(1);
  const shortcutCount = Math.min(targets.length, 9);
  const shortcutHint =
    shortcutCount === 0
      ? ""
      : shortcutCount === 1
        ? " · key 1"
        : ` · keys 1–${shortcutCount}`;

  function center(env: RoomEnvironment): { x: number; y: number } {
    const { stage } = env;
    return {
      x: stage.width / 2,
      y: stage.width < 680 ? stage.height * 0.49 : stage.height * 0.515,
    };
  }

  function orbitRings(env: RoomEnvironment): OrbitRing[] {
    const { stage } = env;
    const targetCount = Math.max(targets.length, 1);
    const narrow = stage.width < 680;
    const wide = !narrow && stage.width / Math.max(stage.height, 1) >= 1.25;
    const maxPerRing = narrow ? 5 : 6;
    const ringCount = Math.max(1, Math.ceil(targetCount / maxPerRing));

    // Mobile stays compact and touch-safe. Desktop uses an intentionally
    // anisotropic orbital volume: broad horizontally, shallow vertically.
    const mobileBase = Math.min(stage.width, stage.height);
    const desktopOuterX = Math.min(stage.width * 0.33, stage.height * 0.58);
    const desktopOuterDepth = Math.min(stage.width * 0.22, stage.height * 0.39);

    const counts = Array.from({ length: ringCount }, () =>
      Math.floor(targetCount / ringCount),
    );
    for (let index = 0; index < targetCount % ringCount; index += 1) {
      counts[index] += 1;
    }

    return counts.map((count, ring) => {
      const t = ringCount <= 1 ? 1 : ring / (ringCount - 1);

      if (narrow) {
        const minRadius = ringCount === 1 ? 0.28 : 0.17;
        const maxRadius = ringCount === 1 ? 0.28 : 0.4;
        const radius = mobileBase * (minRadius + (maxRadius - minRadius) * t);

        return {
          count,
          radiusX: radius,
          radiusDepth: radius,
          speed: (0.000085 + ring * 0.000018) * (ring % 2 === 0 ? 1 : -1),
          phase: -Math.PI / 2 + ring * 0.71,
          tilt: 0.5 + Math.min(ring, 3) * 0.085,
          orientation: (ring % 2 === 0 ? -1 : 1) * (0.1 + ring * 0.045),
        };
      }

      const innerX = desktopOuterX * (wide ? 0.44 : 0.48);
      const innerDepth = desktopOuterDepth * 0.48;

      return {
        count,
        radiusX: innerX + (desktopOuterX - innerX) * t,
        radiusDepth: innerDepth + (desktopOuterDepth - innerDepth) * t,
        speed: (0.000078 + ring * 0.000017) * (ring % 2 === 0 ? 1 : -1),
        phase: -Math.PI / 2 + ring * 0.71,
        tilt: 0.46 + Math.min(ring, 3) * 0.045,
        orientation: (ring % 2 === 0 ? -1 : 1) * (0.055 + ring * 0.026),
      };
    });
  }

  function projectPoint(
    env: RoomEnvironment,
    ring: OrbitRing,
    angle: number,
  ): ProjectedPoint {
    const { stage } = env;
    const { x: cx, y: cy } = center(env);
    const localX = Math.cos(angle) * ring.radiusX;
    const depthAxis = Math.sin(angle) * ring.radiusDepth;

    const planeY = depthAxis * Math.sin(ring.tilt);
    const depth = depthAxis * Math.cos(ring.tilt);

    const cosO = Math.cos(ring.orientation);
    const sinO = Math.sin(ring.orientation);
    const rotatedX = localX * cosO - planeY * sinO;
    const rotatedY = localX * sinO + planeY * cosO;

    const focal = Math.min(stage.width, stage.height) * 2.75;
    const scale = focal / Math.max(focal - depth, focal * 0.45);

    return {
      x: cx + rotatedX * scale,
      y: cy + rotatedY * scale,
      depth,
      scale,
    };
  }

  function orbitNodes(env: RoomEnvironment): OrbitNode[] {
    const { stage } = env;
    const rings = orbitRings(env);
    const nodes: OrbitNode[] = [];
    let targetIndex = 0;

    rings.forEach((ring, ringIndex) => {
      const ringAngle = stage.time * ring.speed + ring.phase;

      for (let slot = 0; slot < ring.count; slot += 1) {
        const target = targets[targetIndex];
        if (!target) break;

        const angle = ringAngle + slot * (TAU / ring.count);
        const projected = projectPoint(env, ring, angle);
        const desktopBoost =
          stage.width < 680 ? 1 : stage.width >= 1200 ? 1.95 : 1.55;
        const baseRadius =
          (8.2 + ((targetIndex * 7 + ringIndex * 3) % 4) * 0.85) *
          desktopBoost;

        nodes.push({
          room: target.id,
          title: target.title,
          x: projected.x,
          y: projected.y,
          r: baseRadius * projected.scale,
          ring: ringIndex,
          depth: projected.depth,
          scale: projected.scale,
          hue: 208 + ((targetIndex * 29 + ringIndex * 11) % 66),
        });

        targetIndex += 1;
      }
    });

    return nodes;
  }

  function nearestOrbitNode(
    nodes: OrbitNode[],
    x: number,
    y: number,
  ): OrbitNode | undefined {
    let nearest: OrbitNode | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const node of nodes) {
      const distance = dist({ x, y }, node);
      const hitRadius = Math.max(28, node.r + 18);
      if (distance <= hitRadius && distance < nearestDistance) {
        nearest = node;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function drawOrbitPath(env: RoomEnvironment, ring: OrbitRing, ringIndex: number): void {
    const { ctx } = env.stage;
    const segments = 96;

    for (let segment = 0; segment < segments; segment += 1) {
      const a0 = (segment / segments) * TAU;
      const a1 = ((segment + 1) / segments) * TAU;
      const p0 = projectPoint(env, ring, a0);
      const p1 = projectPoint(env, ring, a1);
      const depthNorm =
        ((p0.depth + p1.depth) * 0.5) / Math.max(ring.radiusDepth, 1);
      const front = (depthNorm + 1) * 0.5;
      const alpha = (ringIndex === 0 ? 0.035 : 0.022) + front * 0.055;

      ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(4)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }

  function drawBody(
    env: RoomEnvironment,
    node: OrbitNode,
    index: number,
    hovered: boolean,
  ): void {
    const { stage, visited } = env;
    const { ctx } = stage;
    const { x: cx, y: cy } = center(env);
    const visitedBoost = visited.has(node.room) ? 1 : 0.78;
    const pulse = 1 + Math.sin(stage.time * 0.0018 + index * 1.47) * 0.08;
    const radius = node.r * (hovered ? 1.2 : 1) * pulse;

    stage.glow(
      node.x,
      node.y,
      radius * (hovered ? 2.25 : 1.65),
      hovered
        ? `hsla(${node.hue}, 72%, 84%, 0.42)`
        : `hsla(${node.hue}, 62%, 77%, 0.2)`,
      `hsla(${node.hue}, 66%, 62%, 0)`,
    );

    const lightDx = cx - node.x;
    const lightDy = cy - node.y;
    const lightLength = Math.max(1, Math.hypot(lightDx, lightDy));
    const highlightX = node.x + (lightDx / lightLength) * radius * 0.42;
    const highlightY = node.y + (lightDy / lightLength) * radius * 0.42;

    const body = ctx.createRadialGradient(
      highlightX,
      highlightY,
      radius * 0.08,
      node.x,
      node.y,
      radius * 1.08,
    );
    body.addColorStop(
      0,
      hovered
        ? "rgba(255,255,255,0.98)"
        : `hsla(${node.hue}, 74%, 93%, ${0.9 * visitedBoost})`,
    );
    body.addColorStop(
      0.42,
      `hsla(${node.hue}, 52%, 72%, ${0.78 * visitedBoost})`,
    );
    body.addColorStop(
      0.78,
      `hsla(${node.hue + 8}, 46%, 36%, ${0.82 * visitedBoost})`,
    );
    body.addColorStop(1, "rgba(8,10,18,0.96)");

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = hovered
      ? "rgba(255,255,255,0.78)"
      : `rgba(255,255,255,${0.2 + node.scale * 0.055})`;
    ctx.lineWidth = hovered ? 1.4 : stage.width >= 680 ? 1.05 : 0.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 1.8, 0, TAU);
    ctx.stroke();

    if (visited.has(node.room)) {
      ctx.fillStyle = "rgba(255,244,214,0.72)";
      ctx.beginPath();
      ctx.arc(
        node.x + radius * 0.78,
        node.y - radius * 0.58,
        Math.max(1.2, 1.7 * node.scale),
        0,
        TAU,
      );
      ctx.fill();
    }
  }

  function drawCentralLight(env: RoomEnvironment): void {
    const { stage } = env;
    const { ctx } = stage;
    const { x: cx, y: cy } = center(env);
    const breathe = 1 + Math.sin(stage.time * 0.0011) * 0.045;

    stage.glow(
      cx,
      cy,
      104 * breathe,
      "rgba(255,242,210,0.22)",
      "rgba(255,220,160,0)",
    );
    stage.glow(
      cx,
      cy,
      28 * breathe,
      "rgba(255,248,226,0.98)",
      "rgba(255,226,171,0)",
    );

    const core = ctx.createRadialGradient(
      cx - 5,
      cy - 6,
      1,
      cx,
      cy,
      15 * breathe,
    );
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(0.28, "rgba(255,248,225,0.98)");
    core.addColorStop(0.72, "rgba(255,211,136,0.88)");
    core.addColorStop(1, "rgba(126,74,20,0.2)");

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 14 * breathe, 0, TAU);
    ctx.fill();
  }

  return {
    id: "atrium",
    title: "The Atrium",
    copy: `${countLabel} quiet anomalies orbit the light. Pick the one that notices you back.`,
    hint: `click an anomaly · Tab to stage, arrows + Enter for any room${shortcutHint}`,

    draw(env): void {
      const { stage } = env;
      const { ctx } = stage;
      stage.clear("#050509");
      stage.drawStars(1);

      const { x: cx, y: cy } = center(env);
      const rings = orbitRings(env);

      const wordmarkSize = Math.min(stage.width * 0.155, stage.height * 0.22);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font =
        `700 ${wordmarkSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fillText(
        "SOLARIUM",
        cx,
        Math.max(wordmarkSize * 0.72, stage.height * 0.185),
      );
      ctx.restore();

      rings.forEach((ring, index) => drawOrbitPath(env, ring, index));

      if (stage.pointer.active) {
        const gradient = ctx.createLinearGradient(
          cx,
          cy,
          stage.pointer.x,
          stage.pointer.y,
        );
        gradient.addColorStop(0, "rgba(255,245,220,0.1)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(stage.pointer.x, stage.pointer.y);
        ctx.stroke();
      }

      const nodes = orbitNodes(env);
      const hoveredNode = stage.pointer.active
        ? nearestOrbitNode(nodes, stage.pointer.x, stage.pointer.y)
        : undefined;

      const sorted = [...nodes].sort((a, b) => a.depth - b.depth);
      const back = sorted.filter((node) => node.depth <= 0);
      const front = sorted.filter((node) => node.depth > 0);

      back.forEach((node) => {
        const index = nodes.findIndex((candidate) => candidate.room === node.room);
        drawBody(env, node, index, hoveredNode?.room === node.room);
      });

      drawCentralLight(env);

      front.forEach((node) => {
        const index = nodes.findIndex((candidate) => candidate.room === node.room);
        drawBody(env, node, index, hoveredNode?.room === node.room);
      });

      if (hoveredNode) {
        const labelY = hoveredNode.y + Math.max(34, hoveredNode.r + 26);
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.fillText(
          hoveredNode.title.toUpperCase(),
          hoveredNode.x,
          Math.min(stage.height - 26, labelY),
        );
      }
    },

    click(env, x, y): RoomId | void {
      return nearestOrbitNode(orbitNodes(env), x, y)?.room;
    },
  };
}
