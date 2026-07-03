# Backend Architect Memory — FrenchMaster server

- [Vocabulary i18n system](project_vocabulary_i18n.md) — Language/VocabularyTranslation, CSV import/export, primaryLanguageCode, shipped 2026-07-02
- [Verification-before-done loop](feedback_verification_before_done.md) — typecheck/build/lint/test + add vitest unit tests for new pure logic
- [Lesson Engine API](project_lesson_engine_api.md) — LessonEngineLesson admin+public CRUD, structural-only card validation, shipped 2026-07-02
- [server/ vitest config gap](project_server_vitest_config_gap.md) — npm run test silently ran 0 tests until server/vitest.config.ts was added, fixed 2026-07-02
- [Lesson Engine Courses + role gating](project_lesson_engine_courses_and_gating.md) — Course/Section hierarchy, requiredRole gating, AI vocab translation, shipped 2026-07-03
- [env test-mocking gap](project_env_test_mocking_gap.md) — importing ../config/env (even transitively) in a vitest test crashes the run unless mocked; JWT secrets missing from server/.env
