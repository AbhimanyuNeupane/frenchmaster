# services/content/

The content source abstraction.

- `types.ts` — re-exports the `LessonContentProvider` interface + the typed
  `LessonLoadError`.
- `schema.ts` — Zod schemas mirroring the Phase 3 types. Every loaded lesson is
  validated here; a schema failure becomes a `LessonLoadError` (caught by the
  renderer's error boundary), never an unhandled crash inside a card.
- `localJsonProvider.ts` — today's provider, reading bundled JSON via the
  manifest in `data/lessons/`.
- `index.ts` — the factory/singleton `getContentProvider()`.

**Design point:** components never import a concrete provider — they go through
`getContentProvider()` and, in React, through the `useLesson`/`useCourse` hooks.

**Extension point — go cloud:** implement `LessonContentProvider` (e.g.
`ApiContentProvider`/`S3ContentProvider` fetching from a signed URL) and select
it in **`services/content/index.ts`** — the one place a provider is chosen.
Nothing else in the app changes. The local JSON layout
(`data/lessons/<lang>/<level>/<id>.json`) already mirrors the future S3 key
layout, so it's a data-location change, not a shape change.
