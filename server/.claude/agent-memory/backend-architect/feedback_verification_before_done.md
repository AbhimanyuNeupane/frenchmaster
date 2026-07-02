---
name: feedback-verification-before-done
description: Always run typecheck + build + lint + tests (and add tests for new pure-logic code) before reporting a backend task done in this repo
metadata:
  type: feedback
---

Before reporting any non-trivial backend change as complete in this repo,
run in `server/`: `npm run typecheck`, `npm run build`, `npm run lint`,
`npm run test`. Read back every file changed at least once (Write/Edit tool
output is not a substitute for a real sanity check of tricky logic —
transactions, validation refines, CSV parsing edge cases).

**Why:** The calling process explicitly asked for this verification loop
and said it would independently re-verify afterward regardless — the bar
is "don't hand over code you haven't at least typechecked and read once."
This is a Prisma + Express + TypeScript backend with `noUnusedLocals`/
`noUnusedParameters` strict mode on, so small mistakes (unused imports,
wrong Prisma relation-vs-scalar create shape) fail loudly at typecheck
time if you actually run it.

**How to apply:** After Prisma schema/client changes, always run
`npx prisma generate` first — the generated client under
`node_modules/.prisma/client` can be stale relative to `schema.prisma` if
migrations were applied out-of-band (e.g. via Supabase MCP tools directly
against the live DB rather than through `prisma migrate`). Also: this repo
had zero existing test files despite `vitest` being configured
(`server/src/tests/` didn't exist before 2026-07-02) — when adding
non-trivial pure-logic code (CSV validation, translation-resolution
helpers), add a focused vitest unit test under `server/src/tests/`,
mocking `../config/prisma` and any repository module with `vi.mock`,
rather than skipping tests because "there's no precedent."
