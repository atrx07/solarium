import type { RoomEnvironment, RoomId, RoomModule } from "../core/room";
import { TAU, dist } from "../core/stage";

type OrbitNode = {
  room: RoomId;
  title: string;
  x: number;
  y: number;
  r: number;
  ring: number;
};

type OrbitRing = {
  count: number;
  radius: number;
  squash: number;
  speed: number;
  phase: number;
};

export function createAtriumRoom(targets: RoomModule[]): RoomModule {
  const countWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const rawCount = countWords[targets.length] ?? String(targets.length);
  const countLabel = rawCount.charAt(0).toUpperCase() + rawCount.slice(1);
  // A keydown event carries one digit, never a multi-digit room number.
  const shortcutCount = Math.min(targets.length, 9);
  const shortcutHint =
    shortcutCount === 0
      ? ""
      : shortcutCount === 1
        ? " · key 1"
        : ` · keys 1–${shortcutCount}`;

  function orbitRings(env: RoomEnvironment): OrbitRing[] {
    const { stage } = env;
    const targetCount = Math.max(targets.length, 1);
    const maxPerRing = stage.width < 680 ? 6 : 8;
    const ringCount = Math.max(1, Math.ceil(targetCount / maxPerRing));
    const base = Math.min(stage.width, stage.height);
    const narrow = stage.width < 680;
    const minRadius = ringCount === 1 ? 0.28 : narrow ? 0.2 : 0.17;
    const maxRadius = ringCount === 1 ? 0.28 : narrow ? 0.43 : 0.36;
    const step = ringCount <= 1 ? 0 : (maxRadius - minRadius) / (ringCount - 1);

    const counts = Array.from({ length: ringCount }, () =>
      Math.floor(targetCount / ringCount),
    );
    for (let index = 0; index < targetCount % ringCount; index += 1) {
      counts[index] += 1;
    }

    return counts.map((count, ring) => ({
      count,
      radius: base * (minRadius + ring * step),
      squash:
        (narrow ? 0.74 : 0.68) - Math.min(ring, 2) * (narrow ? 0.028 : 0.035),
      speed: (0.000105 + ring * 0.000022) * (ring % 2 === 0 ? 1 : -1),
      phase: ring * 0.63 - Math.PI / 2,
    }));
  }

  function orbitNodes(env: RoomEnvironment): OrbitNode[] {
    const { stage } = env;
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const rings = orbitRings(env);
    const nodes: OrbitNode[] = [];
    let targetIndex = 0;

    rings.forEach((ring, ringIndex) => {
      const angle = stage.time * ring.speed + ring.phase;

      for (let slot = 0; slot < ring.count; slot += 1) {
        const target = targets[targetIndex];
        if (!target) break;

        const a = angle + slot * (TAU / ring.count);
        nodes.push({
          room: target.id,
          title: target.title,
          x: cx + Math.cos(a) * ring.radius,
          y: cy + Math.sin(a) * ring.radius * ring.squash,
          r: 11 + ((targetIndex + ringIndex) % 4) * 1.6,
          ring: ringIndex,
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
    let nearestDistance = 38;

    // Overlapping hit areas must select the closest orb, not the first room.
    for (const node of nodes) {
      const distance = dist({ x, y }, node);
      if (distance < nearestDistance) {
        nearest = node;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  return {
    id: "atrium",
    title: "The Atrium",
    copy: `${countLabel} quiet anomalies orbit the light. Pick the one that notices you back.`,
    hint: `click an anomaly · Tab to stage, arrows + Enter for any room${shortcutHint}`,

    draw(env): void {
      const { stage, visited } = env;
      stage.clear("#050509");
      stage.drawStars(1);

      const cx = stage.width / 2;
      const cy =
        stage.width < 680
          ? stage.height * 0.49
          : stage.height / 2;
      const rings = orbitRings(env);

      // The title behaves like architecture, not interface chrome. Drawing it
      // before the orbital system lets the anomalies pass in front of it.
      const wordmarkSize = Math.min(stage.width * 0.155, stage.height * 0.22);
      stage.ctx.save();
      stage.ctx.textAlign = "center";
      stage.ctx.textBaseline = "middle";
      stage.ctx.font =
        `700 ${wordmarkSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      stage.ctx.fillStyle = "rgba(255,255,255,0.045)";
      stage.ctx.fillText(
        "SOLARIUM",
        cx,
        Math.max(wordmarkSize * 0.72, stage.height * 0.185),
      );
      stage.ctx.restore();

      rings.forEach((ring, index) => {
        stage.ctx.strokeStyle =
          index === 0
            ? "rgba(255,255,255,0.065)"
            : "rgba(255,255,255,0.042)";
        stage.ctx.lineWidth = 1;
        stage.ctx.beginPath();
        stage.ctx.ellipse(
          cx,
          cy,
          ring.radius,
          ring.radius * ring.squash,
          0,
          0,
          TAU,
        );
        stage.ctx.stroke();
      });

      const breathe = 1 + Math.sin(stage.time * 0.0011) * 0.045;
      stage.glow(
        cx,
        cy,
        96 * breathe,
        "rgba(255,242,210,0.22)",
        "rgba(255,220,160,0)",
      );
      stage.glow(
        cx,
        cy,
        22 * breathe,
        "rgba(255,250,235,1)",
        "rgba(255,226,171,0)",
      );

      if (stage.pointer.active) {
        const gradient = stage.ctx.createLinearGradient(
          cx,
          cy,
          stage.pointer.x,
          stage.pointer.y,
        );
        gradient.addColorStop(0, "rgba(255,245,220,0.14)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        stage.ctx.strokeStyle = gradient;
        stage.ctx.lineWidth = 0.7;
        stage.ctx.beginPath();
        stage.ctx.moveTo(cx, cy);
        stage.ctx.lineTo(stage.pointer.x, stage.pointer.y);
        stage.ctx.stroke();
      }

      const nodes = orbitNodes(env);
      const hoveredNode = stage.pointer.active
        ? nearestOrbitNode(nodes, stage.pointer.x, stage.pointer.y)
        : undefined;

      for (const [index, node] of nodes.entries()) {
        const hovered = hoveredNode?.room === node.room;
        const pulse = 1 + Math.sin(stage.time * 0.002 + index * 1.7) * 0.12;
        const visitedBoost = visited.has(node.room) ? 1 : 0.72;

        stage.glow(
          node.x,
          node.y,
          (hovered ? 38 : 25) * pulse,
          hovered
            ? "rgba(207,221,255,0.44)"
            : "rgba(185,198,255,0.23)",
          "rgba(120,140,255,0)",
        );

        stage.ctx.fillStyle = hovered
          ? "#ffffff"
          : `rgba(232,236,255,${visitedBoost})`;
        stage.ctx.beginPath();
        stage.ctx.arc(
          node.x,
          node.y,
          hovered ? node.r * 0.7 : node.r * 0.48,
          0,
          TAU,
        );
        stage.ctx.fill();

        stage.ctx.strokeStyle = hovered
          ? "rgba(255,255,255,0.65)"
          : "rgba(255,255,255,0.17)";
        stage.ctx.lineWidth = 1;
        stage.ctx.beginPath();
        stage.ctx.arc(
          node.x,
          node.y,
          node.r + 9 + Math.sin(stage.time * 0.0015 + index) * 3,
          0,
          TAU,
        );
        stage.ctx.stroke();

        if (hovered) {
          stage.ctx.font =
            "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          stage.ctx.textAlign = "center";
          stage.ctx.fillStyle = "rgba(255,255,255,0.75)";
          stage.ctx.fillText(node.title.toUpperCase(), node.x, node.y + 42);
        }
      }

    },

    click(env, x, y): RoomId | void {
      return nearestOrbitNode(orbitNodes(env), x, y)?.room;
    },
  };
}
