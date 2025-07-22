import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: "buffer/",
      process: "process/browser",
    },
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ],
    },
  },
});
