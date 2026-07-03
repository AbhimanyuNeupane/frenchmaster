import { defineConfig } from "vitest/config";

/**
 * Server-workspace-local vitest config. Without this file, `vitest` walks up
 * to the monorepo root and picks up the frontend's `vitest.config.ts`, whose
 * `include: ["src/lesson-engine/**"]` is deliberately scoped to the Next.js
 * app (see that file's comment: "so the unrelated server/ workspace ...
 * aren't pulled in") — which silently made `npm run test` here match zero
 * files. This config keeps the server workspace's tests self-contained.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/tests/**/*.{test,spec}.ts"],
  },
});
