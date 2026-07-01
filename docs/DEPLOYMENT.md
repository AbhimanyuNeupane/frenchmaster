# Deployment — Supabase + Vercel + Railway

Chosen split (decided with the user): **Postgres on Supabase**, **Next.js
frontend on Vercel**, **Express backend (`server/`) on Railway**. The
backend stays as-is (`app.listen()`, a persistent process) — that only
works on a host that keeps a process alive, which Vercel serverless
functions do not do. Railway needs zero code changes for this.

```
┌─────────────┐      HTTPS       ┌──────────────┐      Postgres      ┌──────────┐
│   Vercel     │ ───────────────▶│   Railway     │ ──────────────────▶│ Supabase │
│  (Next.js)   │◀─────────────── │  (Express)    │◀──────────────────  │ Postgres │
└─────────────┘   NEXT_PUBLIC_   └──────────────┘    DATABASE_URL /   └──────────┘
                   API_URL                            DIRECT_URL
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Redis (Railway│
                                  │  plugin, for  │
                                  │   BullMQ)     │
                                  └──────────────┘
```

## 1. Supabase (database)

1. Create a Supabase project. In **Project Settings → Database**, you'll
   find two connection strings — you need both:
   - **Connection pooling** (Supavisor, port `6543`, `?pgbouncer=true`) →
     this is `DATABASE_URL`. All normal app queries go through this.
   - **Direct connection** (port `5432`) → this is `DIRECT_URL`. Prisma
     uses this only for `prisma migrate deploy`, which needs a non-pooled
     connection to work reliably (this is why `server/prisma/schema.prisma`
     now declares both `url` and `directUrl` — see the datasource block).
2. Run the migration once, from your own machine or CI, against
   `DIRECT_URL` (set both env vars locally when you do this):
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma db seed   # optional — demo data, see prisma/seed.ts
   ```
   Railway does not need to run migrations itself unless you wire that into
   its build/start command; running it manually before first deploy is
   simplest.
3. You are **not** using Supabase Auth or Supabase Storage yet — the app
   has its own JWT auth, and no file upload feature exists yet. The
   `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE` env vars
   are plumbed into `server/src/config/env.ts` but unused by any code path
   today. Leave them blank until you build a feature that needs Supabase
   Storage (per CLAUDE.md, that's still an open choice vs. Cloudflare R2 —
   see `docs/BACKEND_STATUS.md` open question #6).

## 2. Railway (backend — `server/`)

Deploy the `server/` directory as its own Railway service (root directory =
`server`, build command `npm run build`, start command `npm run start`).

Also add Railway's **Redis plugin** to the same project — it injects a
`REDIS_URL` automatically, no separate signup needed, and keeps Redis on
the same private network as the app (lower latency than an external
provider like Upstash). The BullMQ setup today is just a skeleton queue/
worker with no real jobs yet, so this is low-stakes either way — but the
app won't boot without *some* value in `REDIS_URL` since `env.ts` requires it
(it defaults to `redis://localhost:6379`, which won't exist on Railway).

### Environment variables (Railway service)

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | *(leave unset)* | Railway injects its own `PORT`; `env.ts` already reads `process.env.PORT`. |
| `DATABASE_URL` | Supabase pooled connection string (port 6543, `?pgbouncer=true`) | |
| `DIRECT_URL` | Supabase direct connection string (port 5432) | Only read by `prisma migrate` — harmless to also set here in case you wire migrations into the Railway build step later. |
| `JWT_SECRET` | random 64-char string | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | different random 64-char string | Must differ from `JWT_SECRET`. |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Default is fine to start. |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | `30` | |
| `REDIS_URL` | auto-injected by Railway's Redis plugin | Don't hand-set this if you add the plugin — Railway wires it in. |
| `NEXT_PUBLIC_APP_URL` | your Vercel frontend URL, e.g. `https://frenchmaster.vercel.app` | Used server-side as the CORS allowlist (`src/app.ts`) — must be the exact frontend origin. |
| `NEXT_PUBLIC_API_URL` | your Railway backend URL, e.g. `https://frenchmaster-api.up.railway.app` | Not currently read by any backend code; harmless to set for symmetry with the frontend's copy of the same var. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | *(blank)* | Leave unset — `/api/auth/google` correctly 501s until these are real. |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | *(blank)* | Same — `/api/auth/apple` 501s. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE` | *(blank)* | Unused until a storage feature is built. |
| `ELEVENLABS_API_KEY` / `GOOGLE_TTS_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | *(blank)* | Unused — no AI features wired up yet. |
| `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` | *(blank)* | Unused — no payments feature. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | *(blank)* | Unused — no transactional email yet. |

## 3. Vercel (frontend — repo root)

The frontend is currently 100% mock data (`src/lib/mock-data.ts`,
`src/lib/mock-vocabulary.ts`) — **no code today actually calls the
backend**, so strictly nothing is required to deploy it as-is. Set these
anyway so they're in place for when you wire up real `fetch` calls:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | your Railway backend URL, e.g. `https://frenchmaster-api.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | your Vercel deployment URL, e.g. `https://frenchmaster.vercel.app` |

Root directory for the Vercel project should be the repo root (where
`package.json`/`next.config.ts` live) — do **not** point Vercel at `server/`,
that's the Railway deploy.

## Database schema

Source of truth: [`server/prisma/schema.prisma`](../server/prisma/schema.prisma).
Summary of what exists today (Dashboard + Vocabulary features only — see
`docs/BACKEND_STATUS.md` for what's deliberately not built yet):

| Table | Purpose |
|---|---|
| `users` | Account, profile, current CEFR level, coins, daily goal minutes. |
| `refresh_tokens` | Hashed refresh tokens for JWT rotation. |
| `units` / `lessons` | Minimal curriculum structure — just enough to resolve the dashboard's "continue/today's lesson" cards. |
| `lesson_progress` | Per-(user, lesson) completion percentage. |
| `skill_score_snapshots` | Latest score per (user, skill) — pronunciation/grammar/listening/reading/speaking/vocabulary. No producer writes to this yet (see open question). |
| `mistake_logs` | Raw mistake events, aggregated into the dashboard's "weak topics." |
| `achievements` / `user_achievements` | Badge catalog + per-user unlock progress. |
| `daily_activity` | Per-(user, day) minutes studied — drives streaks and weekly study time. |
| `xp_transactions` | Append-only XP ledger. |
| `exams` | Minimal exam metadata (availability, section-readiness counters). |
| `vocabulary_words` | Word catalog: French/English, gender, IPA, example, synonyms, common mistake, level, category. |
| `user_vocabulary_progress` | Per-(user, word) favorite flag + simple manual mastery status. |

Enums: `CEFRLevel`, `SkillKey`, `Role`, `AchievementIcon`, `AuthProvider`,
`WordGender`, `PartOfSpeech`, `MasteryStatus` — all defined at the top of
`schema.prisma`.

**Known gap to fix before/while doing this migration**: `dashboard`'s
`vocabularyLearned` count still derives from `mistake_logs` instead of the
now-real `user_vocabulary_progress` table (see `docs/BACKEND_STATUS.md`
open question #7). Not a blocker for deploying, but worth fixing so the
number on the dashboard is actually correct once both features are live
against the same database.

## Deploy order

1. Supabase project → get `DATABASE_URL` + `DIRECT_URL`.
2. Run `prisma migrate deploy` (+ optional seed) against `DIRECT_URL` from
   your machine.
3. Railway service from `server/`, env vars above, add the Redis plugin.
4. Vercel project from repo root, env vars above.
5. Update Railway's `NEXT_PUBLIC_APP_URL` once you know the real Vercel URL
   (CORS will reject the frontend's requests until this matches exactly).
