# Backend Status & Open Questions

Written after building and verifying the backend, feature by feature,
following the contract-first pattern (frontend UI + contract doc → backend
implementation → independent verification). Covers **Dashboard**
([`BACKEND_API_CONTRACT.md`](./BACKEND_API_CONTRACT.md)) and **Vocabulary**
([`BACKEND_API_CONTRACT_VOCABULARY.md`](./BACKEND_API_CONTRACT_VOCABULARY.md)),
plus the minimal auth needed to protect both. Everything else in CLAUDE.md's
product spec (admin panel, payments, CMS, exam content authoring, speech AI,
the other 12 sidebar sections) is intentionally **not** built yet.

## What exists

`server/` — an independent Node package (own `package.json`), Express +
TypeScript + Prisma + PostgreSQL + Redis/BullMQ, per CLAUDE.md's mandated
stack. Layered `routes → controllers → services → repositories → Prisma`.

- `GET /api/dashboard` — real aggregation from Postgres (streaks, XP ledger,
  mistake-log-derived weak topics, skill snapshots), not hardcoded JSON.
  Matches `src/types/index.ts` field-for-field.
- `GET /api/vocabulary`, `POST /api/vocabulary/:id/favorite`,
  `POST /api/vocabulary/:id/review` — catalog (`VocabularyWord`) joined
  against per-user state (`UserVocabularyProgress`), upserted on first
  interaction. Stats are computed from the user's full set regardless of
  active filters, per the contract. Matches `VocabularyWord`/
  `VocabularyListResponse` field-for-field.
- Auth: email/password register, login, refresh-token rotation, logout.
  Google/Apple OAuth routes exist but correctly 501 ("not configured")
  since there are no real client credentials yet.
- `GET /health`, CORS locked to the frontend origin, rate limiting, Zod
  validation on every input, centralized error envelope.
- Prisma schema, seed script, `docker-compose.yml` (local Postgres+Redis),
  `.env.example`, `server/README.md`.

## Verified vs. not verified

I re-checked both features myself rather than taking either build report at
face value:

| Claim | Verified how |
|---|---|
| TypeScript compiles clean (both passes) | Re-ran `npm run build` and `npm run typecheck` myself in `server/` — clean, no errors |
| Layered architecture / real DB aggregation (not stubs) | Read `dashboard.service.ts`, `vocabulary.service.ts`, `vocabulary.repository.ts`, `schema.prisma`, `auth.controller.ts` directly |
| Vocabulary stats computed from full set, not filtered results | Read `vocabulary.service.ts:getVocabulary` — confirmed `stats` is built from `findAllWordIds`/`findAllProgressForUser`, separately from the filtered `words` array |
| Routes actually protected + validated | Read `vocabulary.routes.ts` — `requireAuth` + Zod `validate()` on all three routes |
| Schema avoids the FK-to-Unit decision the contract flagged as open | Read `schema.prisma` — `unitTitle` is a plain `String`, not a relation |
| OAuth routes correctly stub instead of half-implementing | Confirmed in `auth.controller.ts` |
| `.env.example` covers CLAUDE.md's env var list | Read the file directly |

**Not verified — this environment has no Docker/Postgres/Redis binaries**
(confirmed: `docker --version` → not found here either). So the actual
register → login → dashboard/vocabulary round-trip against a live database
has **never run**, only reasoned about by reading the code. Before trusting
this in a real environment, run it once yourself:

```bash
cd server
cp .env.example .env        # fill in JWT secrets at minimum
docker compose up -d        # postgres + redis
npm install
npm run prisma:migrate
npm run seed
npm run dev
# then: register -> login -> GET /api/dashboard with the bearer token
# also try: GET /api/vocabulary, POST /api/vocabulary/:id/favorite
```

## Gap worth flagging: no tests exist

`package.json` has `vitest`/`supertest` wired up and a `test` script, but
**no test files were actually written** — `find . -iname "*.test.ts"` comes
back empty. CLAUDE.md explicitly calls for unit/integration/E2E test
coverage. This is real debt, not a nitpick: the dashboard aggregation logic
(streak math, weak-topic sorting, XP leveling) is exactly the kind of code
that silently breaks on edge cases (empty history, timezone-boundary days,
users with zero activity) without tests catching it.

## Decisions that need a human (a person, not an agent)

These are genuine product/architecture calls, not implementation details —
each is called out as a comment at its source location too.

1. **XP leveling curve** — currently `100 * n²`, picked arbitrarily
   (`server/src/utils/xpCurve.ts`). Needs an actual game-design decision.
2. **Streak/goal day boundary** — implemented as UTC midnight. If users are
   meant to get a "day" in their own timezone (likely, for a consumer app),
   this needs rework and a `timezone` field on `User`.
3. **Exam "sections ready"** — modeled as two plain counters on `Exam`
   (`sectionsReady`/`sectionsTotal`) because no exam-authoring system exists
   yet. Will need a real `ExamSection` table once that's built.
4. **Skill scores are a materialized snapshot with no producer** — nothing
   writes to `SkillScoreSnapshot` yet because no quiz/pronunciation-scoring
   engine exists. The dashboard will show all zeros until that's built.
5. **OAuth credentials** — need real Google/Apple client IDs and secrets
   before those login methods can work at all.
6. **Storage: Supabase vs. Cloudflare R2** — CLAUDE.md lists both as
   options; nothing depends on this yet, but audio/image upload work later
   will need one picked.
7. **`dashboard.vocabularyLearned` is now stale — a real cross-feature gap I
   found, not something either agent flagged.** It still counts distinct
   `MistakeLog` topics tagged `skillKey: "vocabulary"` (see
   `dashboard.repository.ts:countVocabularyLearned`), even though a real
   `VocabularyWord`/`UserVocabularyProgress` table now exists from the
   Vocabulary pass. This was built in a separate agent session with no
   visibility into the other's schema, so nobody wired them together. It
   should almost certainly become "count of `UserVocabularyProgress` rows
   with `masteryStatus: mastered` (or `learning`+`mastered`) for that user"
   now. Low risk today (nothing depends on the old number being accurate),
   but will silently drift further as more vocabulary gets added — worth
   fixing before this ships, not after.
8. **Vocabulary catalog size / pagination.** Seed data is 15 words. If the
   real catalog reaches the thousands, `GET /api/vocabulary` needs real
   server-side pagination and filtering instead of "return everything,
   filter client-side" — flagged in the contract doc, still unresolved.
9. **Vocabulary ↔ curriculum linkage.** `VocabularyWord.unitTitle` is a
   free-text label, deliberately not a foreign key to the `Unit` table the
   Dashboard schema uses for lessons. Fine for now; will need reconciling
   once "a lesson teaches these words" becomes a real feature.
10. **Vocabulary mastery is a placeholder, not real SRS.** `new → learning →
    mastered` only advances on manual button-tap with no due-dates or
    intervals. CLAUDE.md's actual spaced-repetition requirement likely
    belongs to the future `/practice` section — worth deciding whether
    vocabulary mastery gets absorbed into a shared SRS engine later rather
    than building two separate review systems.
11. **Minor race condition, low stakes today:** favorite/review toggles read
    current state, then write new state, as two separate steps (the upsert
    itself is atomic, but the read-then-decide isn't). Two near-simultaneous
    taps on the same word could lose one toggle (last-write-wins). Not worth
    fixing for a favorite star, but don't reuse this exact pattern anywhere
    a lost update would actually matter.

## Suggested next step

Two features deep into this pattern now (Dashboard, Vocabulary), each built
and verified independently — and each already surfaced a real integration
gap (#7 above) precisely because they don't know about each other's schema.
Before adding a third section, it's worth either (a) spinning up
Postgres/Redis locally once to prove the full stack end-to-end and fix #7
while there, or (b) continuing to Grammar or Listening next but explicitly
telling that backend pass about the vocabulary/dashboard schema so it
doesn't create the same kind of blind spot again.
