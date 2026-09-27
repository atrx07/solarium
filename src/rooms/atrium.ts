import type { RoomEnvironment, RoomId, RoomModule } from "../core/room";
import { TAU, dist } from "../core/stage";

type OrbitNode = {
  room: RoomId;
  title: string;
  x: number;
  y: number;
  r: number;
};

export function createAtriumRoom(targets: RoomModule[]): RoomModule {
  function orbitNodes(env: RoomEnvironment): OrbitNode[] {
    const { stage } = env;
    const cx = stage.width / 2;
    const cy = stage.height / 2;
    const orbit = Math.min(stage.width, stage.height) * 0.28;
    const angle = stage.time * 0.00012;

    return targets.map((target, index) => {
      const a = angle + index * (TAU / targets.length) - Math.PI / 2;
      return {
        room: target.id,
        title: target.title,
        x: cx + Math.cos(a) * orbit,
        y: cy + Math.sin(a) * orbit * 0.64,
        r: 12 + index * 2,
      };
    });
  }

  return {
    id: "atrium",
    title: "The Atrium",
    copy: "Six quiet anomalies are orbiting the light. Pick one.",
    hint: "move slowly · click an orbiting anomaly · keys 1 2 3 4 5 6",

    draw(env): void {
      const { stage, visited } = env;
      stage.clear("#050509");
      stage.drawStars(1);

      const cx = stage.width / 2;
      const cy = stage.height / 2;
      const orbit = Math.min(stage.width, stage.height) * 0.28;

      stage.ctx.strokeStyle = "rgba(255,255,255,0.055)";
      stage.ctx.lineWidth = 1;
      stage.ctx.beginPath();
      stage.ctx.ellipse(cx, cy, orbit, orbit * 0.64, 0, 0, TAU);
      stage.ctx.stroke();

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

      for (const [index, node] of orbitNodes(env).entries()) {
        const hovered =
          stage.pointer.active && dist(stage.pointer, node) < 34;
        const pulse = 1 + Math.sin(stage.time * 0.002 + index * 1.7) * 0.12;
        const visitedBoost = visited.has(node.room) ? 1 : 0.72;

        stage.glow(
          node.x,
          node.y,
          (hovered ? 42 : 28) * pulse,
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

      stage.ctx.textAlign = "center";
      stage.ctx.font =
        "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      stage.ctx.fillStyle = "rgba(255,255,255,0.28)";
      stage.ctx.fillText("ENTER NOTHING / LEAVE DIFFERENT", cx, cy + 142);
    },

    click(env, x, y): RoomId | void {
      const hit = orbitNodes(env).find((node) => dist({ x, y }, node) < 38);
      return hit?.room;
    },
  };
}
