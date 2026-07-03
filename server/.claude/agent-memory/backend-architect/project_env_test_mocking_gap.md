---
name: project-env-test-mocking-gap
description: server/.env lacks JWT_SECRET/JWT_REFRESH_SECRET, so any test importing (even transitively) ../config/env crashes the test run — discovered 2026-07-03
metadata:
  type: project
---

`server/.env` only carries `DATABASE_URL`/`DIRECT_URL`. `JWT_SECRET`/
`JWT_REFRESH_SECRET` (required, no default, min 32 chars — see
`src/config/env.ts`) are NOT in `.env` or `.env.local` in this repo — they're
presumably supplied via the shell/Vercel env at actual runtime (`dev`/
deploy), not committed. `src/config/env.ts` parses `process.env` eagerly at
module-import time and calls `process.exit(1)` on failure.

**Consequence:** any vitest test file that imports a module which
transitively imports `../config/env` (directly, or via `../config/logger`,
which also imports it) kills the whole test run with `process.exit
unexpectedly called with "1"` — not a normal assertion failure, a hard
process exit inside vitest's worker.

**Fix applied:** `vi.mock("../config/env", () => ({ env: {
ANTHROPIC_API_KEY: undefined } }))` (plus `vi.mock("../config/logger", ...)`
since it re-imports env) at the top of
`src/tests/translationAi.service.test.ts`, same convention as
`lessonEngine.service.test.ts` mocking `../config/prisma`.

**How to apply:** before writing a new vitest test, check whether the
module under test (or anything it imports) touches `../config/env` or
`../config/logger` — if so, mock both, even if the specific env var you
care about is optional. Don't assume "it's just one optional field" is
safe; the whole schema parse runs on import. See
[[project_server_vitest_config_gap]] for the sibling test-infra gap in this
same repo.
