---
name: project-frenchmaster-backend
description: FrenchMaster backend scope, location, and status — only Dashboard + auth are built; rest of CLAUDE.md's product surface is deliberately out of scope
metadata:
  type: project
---

The backend lives in `server/` at the repo root, as its own independent
Node package (own package.json/tsconfig/prisma) separate from the Next.js
frontend at the repo root `src/`. Stack: Express + TypeScript + Prisma +
PostgreSQL + Redis/BullMQ (skeleton only), per CLAUDE.md's mandate.

Only two things are built: `GET /api/dashboard` (full real aggregation, no
hardcoded values) and email/password auth (register/login/refresh/logout
with JWT + rotating refresh tokens). Google/Apple OAuth are route stubs
that return 501 until real client credentials exist. Everything else in
CLAUDE.md (admin panel, payments, CMS, exam authoring, TTS/STT, the ~13
other sidebar sections) is explicitly out of scope — do not build those
without being asked again, the product spec is much larger than what's
implemented.

**Why:** the frontend (Next.js, already built) only has one real
data-driven screen — Dashboard — currently running on a mock fixture at
`src/lib/mock-data.ts` typed by `src/types/index.ts`. The contract is
documented in `docs/BACKEND_API_CONTRACT.md`. Scope was intentionally
narrowed to "make that one screen real" rather than building the full
CLAUDE.md product surface.

**How to apply:** when asked to extend the backend, check
`docs/BACKEND_API_CONTRACT.md` and `src/types/index.ts` first for any
existing contract before inventing a new shape. When asked to add a new
feature area (vocabulary, grammar, exams content, etc.), treat it as new
scope requiring the same requirements-gathering rigor as the original
build, not an assumed extension of what exists. See
[[frenchmaster-open-decisions]] for unresolved design questions and
[[frenchmaster-schema-conventions]] for schema/architecture conventions
already established.
