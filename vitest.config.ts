import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/lesson-engine/__tests__/setup.ts"],
    // Scope tests to the lesson engine so the unrelated server/ workspace and
    // the existing FrenchMaster app aren't pulled in.
    include: ["src/lesson-engine/**/*.{test,spec}.{ts,tsx}"],
  },
});
