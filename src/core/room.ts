import type { Stage } from "./stage";

export type RoomId =
  | "atrium"
  | "gravitas"
  | "bloom"
  | "resonance"
  | "murmuration"
  | "mycelium"
  | "tides"
  | "reaction";

export type RoomEnvironment = {
  stage: Stage;
  visited: ReadonlySet<RoomId>;
  setStatus: (text: string) => void;
};

export interface RoomModule {
  id: RoomId;
  title: string;
  copy: string;
  hint: string;
  enter?: (env: RoomEnvironment) => void;
  resize?: (env: RoomEnvironment) => void;
  draw: (env: RoomEnvironment, dt: number) => void;
  click?: (env: RoomEnvironment, x: number, y: number) => RoomId | void;
  key?: (env: RoomEnvironment, event: KeyboardEvent) => void;
}
