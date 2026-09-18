import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@client": path.resolve(__dirname, "src/client")
    }
  },
  server: {
    port: 5173
  }
});
