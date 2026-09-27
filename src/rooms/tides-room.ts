import type { RoomModule } from "../core/room";
import { TideField } from "./tides";

const field = new TideField();

export const tidesRoom: RoomModule = {
  id: "tides",
  title: "VI · Tides",
  copy: "Every disturbance survives just long enough to meet the others.",
  hint: "click drops a stone · hold and drag makes rain · R stills the field",

  resize({ stage }): void {
    field.resize(stage.width, stage.height);
  },

  draw({ stage }, dt): void {
    field.draw(stage.ctx, stage.pointer, stage.time, dt);
  },

  click(_env, x, y): void {
    field.disturb(x, y, 2.6, 4);
  },

  key(env, event): void {
    if (event.key.toLowerCase() === "r") {
      field.reset();
      env.setStatus("field / still");
    }
  },
};
