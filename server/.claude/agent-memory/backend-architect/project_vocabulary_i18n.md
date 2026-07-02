---
name: project-vocabulary-i18n
description: Multi-language vocabulary/translation system (Language + VocabularyTranslation tables, CSV import/export, admin language management) shipped 2026-07-02
metadata:
  type: project
---

Full backend implementation of the "unlimited languages for vocabulary" admin
spec landed 2026-07-02: `Language` + `VocabularyTranslation` tables (already
migrated live on Supabase before this work started — I only wrote
application code against them), admin vocabulary CRUD reworked to a
`translations: {languageCode, text}[]` array instead of flat columns, CSV
bulk import/export, admin language management (`/api/admin/languages`), a
public `GET /api/languages` endpoint, and `User.primaryLanguageCode` +
`PATCH /api/auth/me` to let users set/change their native language.

**Why:** Explicit product requirement — admin must be able to add a new
supported language as a pure data operation (one admin dashboard action),
with zero backend/frontend code changes. This is why translations are a
relation table keyed by `languageCode`, never new columns.

**How to apply:** When touching vocabulary or lesson content going forward:
- Never reintroduce a flat `english`/`nepali`/etc. column on
  `VocabularyWord`. All translation text lives in `VocabularyTranslation`
  (`vocabularyWordId`, `languageCode`, `translatedText`), unique per
  `(vocabularyWordId, languageCode)`.
- Learner-facing reads (vocabulary.service.ts, lesson.service.ts) only ever
  surface French + English + the requesting user's own
  `primaryLanguageCode` translation (null if that's "en" or no translation
  row exists yet) — shared logic lives in
  `server/src/utils/vocabularyTranslation.ts`
  (`resolveVocabularyTranslation`). Admin-facing reads
  (admin.service.ts `toAdminVocabularyWord`) return ALL translations on a
  word, unrelated shape.
- `primaryLanguageCode` is deliberately re-read from the DB on every
  request that needs it (via `userRepository.findById`), never taken from
  the JWT payload (`req.user`) — the access token is signed once with only
  `{sub, email, role}` and would go stale the moment a user changes their
  language preference until their next token refresh/login.
- CSV import/export logic lives in
  `server/src/services/vocabularyImport.service.ts` (parsing, per-row
  validation, example/export CSV generation) — kept isolated from
  `admin.service.ts`, which just orchestrates + does DB writes via
  `adminRepository.createVocabularyWordsBulk`.
- Language management (`GET/POST /api/admin/languages`,
  `PATCH /api/admin/languages/:code`) intentionally has no route to change
  `isDefault` or a language's `code` after creation — the default language
  (English) can never be disabled (enforced in `adminService.updateLanguage`).

**Known constraint:** `express.json({ limit: "1mb" })` in `src/app.ts` caps
the `POST /api/admin/vocabulary/import/commit` JSON body size. Fine for
typical imports but could reject an extremely large single-batch commit
(tens of thousands of rows) — bump the limit or paginate commits if that
ever becomes real.

See also [[feedback-verification-before-done]] for the verification loop
used to close this out (typecheck/build/lint/tests all green before
reporting done).
