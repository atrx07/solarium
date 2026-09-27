import { defineConfig } from "vite";

export default defineConfig({
  base: "/solarium/",
  build: {
    target: "es2022",
    sourcemap: true
  }
});
