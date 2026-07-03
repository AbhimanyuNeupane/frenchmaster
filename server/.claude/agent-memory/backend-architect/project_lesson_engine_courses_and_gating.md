---
name: project-lesson-engine-courses-and-gating
description: Course/Section hierarchy + role-based content gating for the Lesson Engine, plus AI-assisted vocabulary translation — shipped 2026-07-03
metadata:
  type: project
---

Three independent features landed in one pass on top of [[project_lesson_engine_api]]
and [[project_vocabulary_i18n]]:

**1. AI-assisted vocabulary translation** (`src/services/translationAi.service.ts`):
raw `fetch` to Anthropic Messages API (`claude-3-5-haiku-20241022`, no SDK
dependency, same convention as `speech.service.ts`'s Whisper call).
`GET /api/admin/vocabulary/ai-translate/status`,
`POST /api/admin/vocabulary/:id/ai-translate` (preview-only, never writes —
admin's existing Save flow persists it), `POST
/api/admin/vocabulary/ai-translate-bulk` (writes directly but ONLY fills
gaps — `adminRepository.addMissingVocabularyTranslations` uses
`createMany({ skipDuplicates: true })` as a DB-level safety net on top of
the JS-side "missing" check, so a human-authored translation can never be
overwritten even under a race). Bulk-fill scans the catalog in pages
(`TRANSLATION_SCAN_PAGE_SIZE=50`, capped at `TRANSLATION_SCAN_MAX_PAGES=20`)
and translates candidates with capped concurrency
(`src/utils/concurrency.ts` `mapWithConcurrency`, cap 4) — never fires N
parallel requests at Anthropic. AI response parsing is defensive: direct
`JSON.parse`, then regex-extract the first `{...}` block, else throw
`ApiError.badRequest`; result is filtered to only the requested language
codes with non-empty string values (drops hallucinated keys) — see
`parseTranslationResponse`/`sanitizeTranslationResult`, both exported and
unit-tested in `src/tests/translationAi.service.test.ts`.

**2. Lesson Engine Course/Section hierarchy**
(`LessonEngineCourse` -> `LessonEngineSection` -> `LessonEngineSectionLesson`,
already migrated live before this work started): admin
`GET/POST /api/admin/lesson-engine/courses`,
`GET/PATCH/DELETE /api/admin/lesson-engine/courses/:id`; public
`GET /api/lesson-engine/courses`, `GET /api/lesson-engine/courses/:id`.
**Update strategy is delete-all-sections-then-recreate inside one
transaction** (`lessonEngine.repository.ts` `updateCourse`) — NOT a diff by
section id, even though the write schema (`courseSectionSchema`) accepts an
optional `id` per section. That `id` is currently unused by persistence
(kept for API/client-state parity, e.g. optimistic UI, not because the
backend needs it) — don't assume it round-trips or is honored on update.
`sections` key absent from a PATCH body means "leave untouched"; present
(even `[]`) means "replace entirely" — same `!== undefined` convention as
the existing `cards` field on lesson update.

**Judgment call — empty sections after publish-filtering**: a public course
section whose every lesson gets filtered out (unpublished/deleted) is still
returned, empty, rather than hidden. Chose this over hiding it so the
course's table-of-contents stays structurally stable instead of sections
silently appearing/disappearing. `LessonEngineSection` itself has NO
`published`/`deletedAt` of its own in the schema — only the *course*
(published/deletedAt) and each *lesson* (published/deletedAt) gate
visibility; a section is just a grouping label.

**3. Role-based content gating** (`LessonEngineLesson.requiredRole Role?`,
nullable = fully public): `src/utils/roleRank.ts` `hasRequiredRole` +
`ROLE_RANK` (`ADMIN>MODERATOR>PREMIUM>USER`). New `optionalAuth` middleware
in `src/middleware/auth.ts` (sibling to `requireAuth`, same Bearer
verification but never throws — `req.user` stays `undefined` on any
failure) is applied at the router level to ALL of
`lessonEnginePublic.routes.ts` (`lessonEnginePublicRouter.use(optionalAuth)`
— lessons AND courses). `listPublishedLessons`/course-embedded lessons
ALWAYS include gated lessons with a `locked: boolean` field (discoverability
— hiding premium content entirely is bad product sense); `getPublishedLesson`
403s with `{ requiredRole }` in `details` if the requester doesn't satisfy
it. **Scoped to `LessonEngineLesson`/`LessonEngineCourse` ONLY** — explicit
non-goal to gate the Vocabulary catalog or the original `/learn` Unit/Lesson
system.

**Files**: `src/services/translationAi.service.ts` (new),
`src/utils/roleRank.ts` (new), `src/utils/concurrency.ts` (new),
`src/middleware/auth.ts` (+`optionalAuth`), `src/repositories/admin.repository.ts`
(+translation-scan/write helpers, `findEnabledLanguages`),
`src/repositories/lessonEngine.repository.ts` (+course CRUD +
`requiredRole` on lesson create/update data + selects),
`src/services/admin.service.ts` (+AI translate methods),
`src/services/lessonEngine.service.ts` (+course methods, `locked`/403
gating), validators/controllers/routes for both admin.* and
lessonEngine.*. Tests: `src/tests/roleRank.test.ts`,
`src/tests/concurrency.test.ts`, `src/tests/translationAi.service.test.ts`
(all mock `../config/env` — see [[project_env_test_mocking_gap]]).

See also [[project_lesson_engine_api]], [[project_vocabulary_i18n]],
[[feedback_verification_before_done]].
