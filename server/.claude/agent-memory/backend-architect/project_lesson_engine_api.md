---
name: project-lesson-engine-api
description: LessonEngineLesson admin+public CRUD API shipped 2026-07-02 — separate from the existing Lesson/Unit system
metadata:
  type: project
---

Built the admin CRUD + public read API for `LessonEngineLesson`
(`server/prisma/schema.prisma`), backing a separate, language-agnostic,
card-based "Universal Lesson Engine" frontend module (`src/lesson-engine/` in
the Next.js app — not touched from this server repo).

**Why a second lesson system:** this is intentionally independent from the
existing `Lesson`/`Unit` models + `lesson.routes.ts`/`lesson.service.ts`
(which back the French-specific `/learn` player). Don't conflate the two —
`LessonEngineLesson` has no course/section relation and no French-specific
fields; `language`/`level` are opaque strings, never enums.

**Files:** `src/repositories/lessonEngine.repository.ts`,
`src/services/lessonEngine.service.ts`,
`src/controllers/lessonEngine.controller.ts`,
`src/validators/lessonEngine.validators.ts`,
`src/routes/lessonEngineAdmin.routes.ts` (mounted `/api/admin/lesson-engine`,
`requireAuth`+`requireRole("ADMIN")`), `src/routes/lessonEnginePublic.routes.ts`
(mounted `/api/lesson-engine`, no auth). Test:
`src/tests/lessonEngine.service.test.ts`.

**Key design decision — validation is structural-only, not full per-card-type:**
the frontend owns a 21-card-type discriminated Zod union in
`src/lesson-engine/services/content/schema.ts` (can't import cross-package).
The server-side `cardSchema` only checks envelope fields
(id/type/content/etc, `.passthrough()`'d) + non-empty array + unique card
ids. Full validation happens client-side before submit and again in the
frontend's `ApiContentProvider`. `POST /api/admin/lesson-engine/lessons/validate`
is a dry-run endpoint with **no `validate()` middleware in front of it** —
it accepts `req.body: unknown` and calls
`lessonEngineService.validateDraft()` internally (via `.safeParse`), because
a hard 422 from route-level middleware would defeat the point of a "does
this pass?" check that's supposed to report `{valid, errors}` as data.

**API response shape:** `cardsJson` (Prisma column) is renamed to `cards` on
every API response — never leaks the column name. List/summary endpoints
(admin list, public list) omit `cards`/`cardsJson` entirely and return
`cardCount` instead, for payload-size reasons; only single-lesson detail
endpoints return the full `cards` array.

**Hardening note:** `createLesson` does a check-then-create existence check
for a fast/clear 409, but ALSO catches Prisma's `P2002` unique-constraint
error (via `Prisma.PrismaClientKnownRequestError`) around the actual insert,
since this repo's `errorHandler.ts` has no generic Prisma-error → HTTP-status
mapping — an uncaught P2002 would otherwise surface as a raw 500 under
concurrent duplicate-id creates.

See also [[project_vocabulary_i18n]], [[feedback_verification_before_done]].
