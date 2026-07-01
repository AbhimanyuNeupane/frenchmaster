---
name: ts-path-alias-build-gotcha
description: tsc does not rewrite @/* path aliases in compiled output — need tsc-alias as a post-build step, or runtime require() fails with MODULE_NOT_FOUND
metadata:
  type: feedback
---

When a TypeScript project uses `@/*` path aliases (via `tsconfig.json`
`paths`) with the default `tsc` compiler and CommonJS output, `tsc` type
checks the aliases fine but does NOT rewrite the `require("@/foo")` calls
in the emitted JS to relative paths. Running the compiled output directly
with `node dist/server.js` throws `Cannot find module '@/app'` even though
`npm run build` succeeded with no errors.

**Why:** discovered while verifying the FrenchMaster `server/` build — the
build step reported success but the compiled server crashed immediately on
`node dist/server.js`. `tsx` (used for `dev`) resolves aliases at runtime
via esbuild so this only shows up in the production build path, not dev —
easy to miss if you only test `npm run dev`.

**How to apply:** whenever scaffolding a new Express/Node + TypeScript
service with `@/*` aliases and a compile-then-run production flow (not
ts-node/tsx in prod), add `tsc-alias` as a dependency and chain it after
`tsc`: `"build": "tsc -p tsconfig.json && tsc-alias -p tsconfig.json"`.
Always smoke-test the actual compiled output (`npm run build && node
dist/server.js`) before declaring the build verified — a clean `tsc`
exit code alone does not prove the compiled artifact runs.
