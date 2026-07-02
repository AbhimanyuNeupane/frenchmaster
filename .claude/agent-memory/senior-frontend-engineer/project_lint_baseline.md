---
name: project-lint-baseline
description: Repo lint baseline is already red; tsc + next build are the real gates for frontend work
metadata:
  type: project
---

`npm run lint` at the repo root reports ~176 pre-existing errors that are NOT
introduced by current work.

**Why:** The ESLint run scans `server/dist/**` (compiled backend JS — one error
per file) plus a few long-standing React-hooks violations in `src/hooks/use-api-query.ts`
and `src/contexts/auth-context.tsx` (`set-state-in-effect` / `use-memo` for the
`[...deps]` spread). None of these have been cleaned up.

**How to apply:** For frontend (`src/`) changes, treat `npx tsc --noEmit` and
`npm run build` (Next.js 16 / Turbopack — build runs its own TS pass) as the
pass/fail gates. When checking lint, filter to the files you actually touched
rather than reacting to the global count. Follow the existing fetch-on-mount
pattern but prefer routing state updates through async callbacks (see
`src/hooks/use-languages.ts`) so you don't add new `set-state-in-effect` errors.
