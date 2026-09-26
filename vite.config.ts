import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@designcodeio/threeui/style.css",
        replacement: decodeURIComponent(new URL("./src/shaders/threeui.css", import.meta.url).pathname.slice(1)),
      },
      {
        find: "@designcodeio/threeui",
        replacement: decodeURIComponent(new URL("./src/shaders/index.ts", import.meta.url).pathname.slice(1)),
      },
    ],
  },
});
