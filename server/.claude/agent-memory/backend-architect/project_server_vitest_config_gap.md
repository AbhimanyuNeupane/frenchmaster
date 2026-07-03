---
name: project-server-vitest-config-gap
description: server/ had no local vitest.config.ts, so npm run test silently matched zero files (fixed 2026-07-02)
metadata:
  type: project
---

`server/package.json`'s `test` script (`vitest run`) had no local
`server/vitest.config.ts`, so vitest walked up the monorepo tree and picked
up the frontend's root `vitest.config.ts` (`src/lesson-engine/**` include,
jsdom environment, React plugin). That root config's own comment says it's
scoped that way specifically "so the unrelated server/ workspace ... aren't
pulled in" — but the inverse wasn't true: server had no config of its own to
fall back on, so `npm run test` in `server/` silently reported "No test
files found, exiting with code 1" for every pre-existing test (e.g.
`vocabularyImport.service.test.ts`), even though the file existed and was
correct.

**Fix applied:** added `server/vitest.config.ts` — `environment: "node"`,
`include: ["src/tests/**/*.{test,spec}.ts"]`, no plugins. This is now the
correct place for any future server-side vitest config changes (coverage
thresholds, setup files, etc) — don't touch the frontend's root
`vitest.config.ts` for backend test concerns.

**How to apply:** if `npm run test` in `server/` ever reports zero test
files found again, check `server/vitest.config.ts` exists and hasn't been
deleted/reverted — that's the first thing to suspect, not the test files
themselves.
