---
name: sandbox-env-constraints
description: This dev sandbox has no Docker, no local Postgres/Redis binaries — cannot spin up real infra for e2e testing
metadata:
  type: project
---

The Windows sandbox this agent runs in (as of 2026-07-01) has Node.js 26 +
npm 11 available, but no `docker`, no `docker compose`, no local `psql`/
`postgres`, and no `redis-server` binary — confirmed via both the Bash tool
(git-bash, PATH has no docker) and PowerShell (`Get-Command` finds
nothing). Full end-to-end verification against a real Postgres/Redis
(migrations, seed, live dashboard curl) is not possible in this
environment.

**Why:** discovered while trying to verify the FrenchMaster backend
end-to-end per the task's explicit instruction to "say so explicitly
rather than claiming it works" if infra can't be started.

**How to apply:** when a task asks for full e2e verification involving a
database or Redis, do what CAN be verified without them (typecheck, build,
boot the Express app, hit routes that fail fast before touching Prisma —
e.g. validation errors, auth-guard 401s, OAuth 501 stubs, health check) and
explicitly and honestly report that DB-dependent paths (actual query
results, migrations, seed data correctness) are unverified, rather than
claiming success. Don't waste time repeatedly retrying `docker` commands —
this has already been confirmed absent.
