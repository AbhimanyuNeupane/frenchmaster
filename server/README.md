# FrenchMaster API

Backend for the FrenchMaster French learning platform. Currently implements:
email/password auth with JWT + refresh token rotation, OAuth route stubs
(Google/Apple), and the `GET /api/dashboard` aggregate endpoint that powers
the frontend Dashboard screen.

Scope note: only the Dashboard and the auth needed to protect it are built.
See "Out of scope" below for everything else CLAUDE.md describes.

## Tech stack

Node.js, Express, TypeScript, PostgreSQL, Prisma, Redis, BullMQ (skeleton
only), JWT, Zod, bcrypt, Helmet, pino.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres + Redis) — or point `DATABASE_URL` / `REDIS_URL`
  at your own instances.

## Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env: at minimum set JWT_SECRET and JWT_REFRESH_SECRET to random
# 32+ char strings. Generate one with:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Start local infrastructure (Postgres + Redis)

```bash
docker compose up -d
```

### Run migrations

```bash
npm run prisma:migrate
```

This creates the database schema from `prisma/schema.prisma` and generates
the Prisma client.

### Seed demo data

```bash
npm run seed
```

Creates one demo user (`camille@frenchmaster.dev` / `Password123`) with
realistic lesson progress, skill scores, mistake logs, achievements, streak
history, and XP — close to the values in the frontend's
`src/lib/mock-data.ts` fixture, so the dashboard is demoable end-to-end.

### Run the dev server

```bash
npm run dev
```

Starts on `http://localhost:4000` (configurable via `PORT`).

## Verifying the full auth -> dashboard flow manually

```bash
# 1. Login with the seeded demo user
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"camille@frenchmaster.dev","password":"Password123"}'

# Copy the accessToken from the response, then:
curl http://localhost:4000/api/dashboard \
  -H "Authorization: Bearer <accessToken>"
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server (`dist/server.js`) |
| `npm run typecheck` | Type-check without emitting |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:migrate:deploy` | Apply migrations in production |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run seed` | Run the seed script |
| `npm test` | Run tests (vitest) |

## Architecture

Clean layered architecture:

```
routes -> controllers -> services -> repositories -> Prisma -> PostgreSQL
```

- **routes/** — Express route wiring + middleware attachment only.
- **controllers/** — HTTP concerns (parse req, call service, shape response). No business logic.
- **services/** — Business logic, orchestration, derived computations (e.g. `dashboard.service.ts` does all the dashboard aggregation math).
- **repositories/** — Prisma queries only, no business logic. Isolates query shape/indexing decisions.
- **validators/** — Zod schemas for request validation.
- **middleware/** — auth guard, centralized error handler, rate limiting, request validation.
- **config/** — env parsing/validation, logger, Prisma client, Redis client singletons.
- **jobs/ + workers/** — BullMQ skeleton (see "Background jobs" below).

## Database schema

See `prisma/schema.prisma` for full definitions and inline comments. Summary:

- `User` — currentLevel (A1-B2), levelProgress, coins, goalMinutesPerDay, soft-deletable.
- `RefreshToken` — hashed (SHA-256) tokens only, supports rotation + revocation.
- `Unit` / `Lesson` — minimal curriculum content, enough to resolve `continueLesson`/`todaysLesson`.
- `LessonProgress` — per-user per-lesson progress (0-100).
- `SkillScoreSnapshot` — latest score per (user, skill) across the 6 fixed skill keys.
- `MistakeLog` — per-attempt correct/incorrect events per topic; aggregated into `weakTopics`.
- `Achievement` (catalog) + `UserAchievement` (per-user unlock/progress).
- `DailyActivity` — per-user per-UTC-day minutes studied; source of truth for streaks and weekly study time.
- `XpTransaction` — append-only XP ledger (sum = total XP).
- `Exam` — minimal exam metadata incl. `sectionsReady`/`sectionsTotal` content-readiness counters.

## API summary

See inline JSDoc-style contracts in each controller, and the canonical
contract doc at `../docs/BACKEND_API_CONTRACT.md`. Quick reference:

### `POST /api/auth/register`
Request: `{ "email": string, "password": string, "name": string }`
Success (201): `{ "success": true, "data": { "user": {...}, "accessToken": string, "refreshToken": string }, "message": "Account created successfully" }`
Errors: 409 (email exists), 422 (validation).

### `POST /api/auth/login`
Request: `{ "email": string, "password": string }`
Success (200): same shape as register.
Errors: 401 (invalid credentials), 422 (validation).

### `POST /api/auth/refresh`
Request: `{ "refreshToken": string }`
Success (200): `{ "success": true, "data": { "user": {...}, "accessToken": string, "refreshToken": string } }` — refresh token is rotated (old one is revoked).
Errors: 401 (invalid/expired/revoked token).

### `POST /api/auth/logout`
Request: `{ "refreshToken": string }`
Success (200): `{ "success": true, "data": null }`. Idempotent.

### `GET /api/auth/google`, `GET /api/auth/apple`
Currently return 501 `{ "success": false, "error": "Google OAuth is not configured yet", ... }` until real OAuth credentials are added.

### `GET /api/dashboard`
Headers: `Authorization: Bearer <accessToken>`
Success (200): `{ "success": true, "data": DashboardData }` — see `../src/types/index.ts` for the exact shape. Fully computed from real tables (no hardcoded values).
Errors: 401 (missing/invalid/expired token).

### `GET /health`
No auth. `{ "success": true, "data": { "status": "ok", "timestamp": "..." } }`.

## Background jobs

`src/jobs/queues.ts` wires up a BullMQ `email` queue against the shared
Redis connection, and `src/workers/email.worker.ts` is a no-op skeleton
worker showing the intended shape. Neither is wired into any real business
flow yet — this is intentionally just the connection/pattern, not real job
processing. Run a worker separately in production: `tsx src/workers/email.worker.ts`.

## Out of scope (explicitly not built)

Admin panel, payments/Stripe, CMS, feature flags, exam content authoring,
certificate PDF generation, speech-to-text/text-to-speech integration, and
the ~13 other sidebar sections (Learn, Vocabulary, Grammar, Listening,
Speaking, Reading, Writing, Practice, Exam content, full Achievements list,
Certificates, Progress detail, Settings, Profile). Only the Dashboard
aggregate endpoint and the minimal auth needed to protect it are implemented.

## Open questions needing a human decision

See the project report for the full list (XP leveling curve formula,
timezone handling for streak boundaries, sectionsReady modeling, OAuth
credentials, Supabase vs R2 for storage, live vs materialized skill scoring).
Each decision point is also flagged with a comment at its source in the code.
