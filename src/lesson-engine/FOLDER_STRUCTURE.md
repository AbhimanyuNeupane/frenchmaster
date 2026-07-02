# Folder Structure (Phase 2)

```
src/lesson-engine/
├── types/            Card, Lesson, Course, Section, validation & provider
│                      interfaces. No implementation code — types only.
├── registry/          Component registry + validator registry (the plugin
│                      mechanism). Pure maps, no React rendering here.
├── cards/              One file per card type (TextCard.tsx, QuizCard.tsx, …).
│                      Each file self-registers into the registries on import.
│                      cards/index.ts is the barrel that imports all of them.
├── engine/             LessonRenderer — the module's public entry point.
│                      Orchestration only; contains no card-specific logic.
├── navigation/         useLessonNavigation — prev/next/skip/restart/resume/
│                      exit, progress %, estimated time.
├── validation/         validateCard + per-type validator functions, each
│                      registered into registry/validatorRegistry.
├── store/              Zustand store (useLessonStore) — lesson session state.
├── persistence/        PersistenceProvider interface + LocalStorageProvider.
│                      Swappable without touching store/ or engine/.
├── services/
│   ├── content/         LessonContentProvider interface + LocalJsonProvider.
│   │                    Swappable without touching hooks/ or engine/.
│   └── media/            MediaService interface + LocalMediaService.
├── hooks/               React Query hooks (useLesson, useCourse) wrapping the
│                      content provider; useMediaService; card-facing hooks.
├── components/          Shared, card-agnostic UI: CardShell (animation
│                      wrapper), ProgressBar, HeartsDisplay, XpDisplay,
│                      ErrorBoundary/fallback screens, RewardAnimation.
├── utils/               Pure helpers (id generation, array shuffle for
│                      matching/drag-order cards, fuzzy string match for
│                      writing validation).
├── data/
│   └── lessons/
│       ├── fr/A1/…       Sample French lessons (today's local-JSON source).
│       └── es/A1/…       Sample Spanish lessons — proves the engine carries
│                          no French-specific logic anywhere.
└── __tests__/          Unit/component/integration tests (Phase 11).
```

Host route (outside this module, consumes it as a package):
```
src/app/lesson-engine/
├── layout.tsx           Minimal layout, no auth (this phase has none).
├── page.tsx              Course/lesson picker.
└── [lessonId]/page.tsx    Hosts <LessonRenderer lessonId=... />.
```

## Future-only folders (do not create yet — listed for the record)

- `services/content/providers/s3.ts`, `services/media/providers/cdn.ts` — real
  cloud implementations, added when the backend/S3 phase starts.
- `persistence/providers/api.ts` — backend-sync persistence.
- `api/` at the module root — thin client for a future real backend.

Creating these now would violate the phase scope ("do NOT build backend/S3");
the interfaces above are what make adding them later a pure addition.
