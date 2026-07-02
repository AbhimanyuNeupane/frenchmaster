# Universal Lesson Engine — Architecture (Phase 1)

## Scope of this module

Everything under `src/lesson-engine/` is self-contained and language-agnostic. It
does not import from, or get imported by, the existing FrenchMaster app
(`src/app/(app)/learn/**`, `src/components/learn/**`, `src/types/lesson.ts`).
That existing route is French-specific and API-backed; this engine is neither.
The two coexist deliberately — see the repo root decision log for why.

Demo/host route: `src/app/lesson-engine/**` (outside the `(app)` route group,
so it renders with no auth — matches this phase's "no backend, no auth" scope).

## The one rule everything else serves

**Adding a new card type must never require touching the renderer, the
navigation engine, the validation engine, or any `switch`/`if-else` chain
that lists card types.** It requires exactly two edits: create the card's
component file (which self-registers), and add one import line to
`cards/index.ts`. Every abstraction below exists to make that rule true.

## Layered dependency direction

```
app route (page.tsx)
      │
      ▼
engine/LessonRenderer          (orchestration only — knows nothing about
      │                         any specific card type)
      ▼
registry/                      (type string -> component, type string -> validator)
      │
      ▼
cards/*Card.tsx                (one file per card type; self-registers on import)
```

```
engine/LessonRenderer ──uses──> navigation/useLessonNavigation ──reads/writes──> store/useLessonStore
                       ──uses──> validation/validateCard        ──reads────────> registry (validators)
                       ──uses──> hooks/useLesson (React Query)  ──reads────────> services/content (provider)
store/useLessonStore   ──persists via──> persistence/ (provider interface)
cards/*                ──resolve media via──> services/media (provider interface)
```

No card component ever imports the store, a content provider, or a
persistence provider directly. Cards receive everything through props
(`CardComponentProps`) and report results through a single `onSubmit`
callback. This is what makes a card portable to a future mobile app: the
component boundary is the reuse boundary.

## Content Provider abstraction (today: local JSON, tomorrow: S3/API)

```ts
// services/content/types.ts
interface LessonContentProvider {
  getLesson(id: string): Promise<Lesson>;
  listLessons(filter: { language: string; level?: string }): Promise<LessonSummary[]>;
  getCourse(id: string): Promise<Course>;
}
```

- Today: `LocalJsonContentProvider` reads from `data/lessons/<lang>/<level>/lesson_id.json`,
  matching the exact future S3 key layout described in the spec
  (`lessons/fr/A1/lesson_001.json`) so the migration is a data-location change,
  not a shape change.
- Tomorrow: `ApiContentProvider` / `S3ContentProvider` implement the same
  interface (fetching from a signed URL instead of a static import).
- Selection happens once, in `services/content/index.ts`, via a factory that
  reads a config flag (currently hardcoded to `"local"`). Nothing else in the
  app ever imports `LocalJsonContentProvider` by name — everything goes
  through `getContentProvider()` and, in components, through the
  `useLesson`/`useCourse` React Query hooks. **Changing providers later is a
  one-file change**, per the requirement.

## Media Service abstraction (today: local assets, tomorrow: S3/CDN)

```ts
// services/media/types.ts
interface MediaService {
  resolveAudioUrl(ref: MediaRef): string;
  resolveImageUrl(ref: MediaRef): string;
}
type MediaRef = { key: string }; // opaque to callers
```

Cards never construct a path/URL themselves — they call `useMediaService()`
and pass the lesson JSON's `media` reference through it. Today's
`LocalMediaService` resolves `key` against `public/lesson-assets/`. A future
`CdnMediaService` resolves the same `key` against a signed CloudFront/S3 URL.
Same one-file-swap guarantee as the content provider.

## Card model

```ts
// types/card.ts
interface CardBase {
  id: string;
  type: string;         // registry key — the ONLY thing that decides which component renders
  title?: string;
  content: unknown;     // narrowed per-type by the discriminated union below
  media?: MediaRef[];
  actions?: CardAction[];
  validation?: unknown; // narrowed per-type; absent = no validation (auto-pass)
  metadata?: Record<string, unknown>;
}
```

`LessonCard` is a discriminated union over `type` (`TextCard | VocabularyCard |
... | RewardCard`), each narrowing `content`/`validation` to its own shape.
This gives full type safety inside each card component while keeping the
renderer's view of a card fully generic (`LessonCard`, never a specific
variant).

## Registry pattern (the extensibility mechanism)

Two independent registries, both keyed by the same `type` string:

```ts
// registry/componentRegistry.ts
registerCardComponent(type: string, component: CardComponent): void
getCardComponent(type: string): CardComponent | undefined

// registry/validatorRegistry.ts
registerValidator(type: string, validator: CardValidator): void
getValidator(type: string): CardValidator | undefined
```

Each card file (`cards/TextCard.tsx`, `cards/QuizCard.tsx`, ...) calls
`registerCardComponent(...)` (and `registerValidator(...)` if it validates)
at module scope — registration is a side effect of importing the file.
`cards/index.ts` is a barrel that imports every card file purely for that
side effect. The renderer and validation engine only ever call `getCardComponent`/
`getValidator` — they contain zero references to any concrete card type name.
An unregistered `type` resolves to `undefined`, which the renderer treats as
the "Unknown Card" fallback (see Error Handling), never a crash.

## Lesson Renderer

`engine/LessonRenderer.tsx` — the entire public API of the engine from the
host app's point of view: `<LessonRenderer lessonId={id} onExit={...} />`.
Responsibilities, and only these: load the lesson (`useLesson`), read the
current card index from `useLessonNavigation`, resolve that card's component
from the registry, render it inside `CardShell` (the Framer Motion
transition wrapper), and wire the card's `onSubmit` result into the
validation engine → store. It does not know what a `VocabularyCard` is.

## Navigation Engine

`navigation/useLessonNavigation(lesson)` — `next / previous / skip / restart /
resume / exit`, plus derived `progressPercent` and `estimatedTimeRemaining`
(sum of remaining cards' `metadata.estimatedSeconds`, degrading gracefully to
a per-card-count estimate if absent). Reads/writes the *current card index*
through `useLessonStore`, not local component state — so navigation state
survives remounts and is what gets persisted.

## Validation Engine

`validation/validateCard(card, response)` — looks up a validator by
`card.type`, calls it, returns a uniform `ValidationResult = { isCorrect:
boolean; score?: number; feedback?: string }`. Cards with no registered
validator (TextCard, ImageCard, InfoCard, SummaryCard, RewardCard) are
treated as auto-correct pass-throughs by the engine — this is a property of
"no validator registered," not a special case the engine hardcodes per type.

## State Management (Zustand)

One store, `store/useLessonStore.ts`, holding exactly: `currentCard`,
`completedCards`, `correctAnswers`, `wrongAnswers`, `xp`, `hearts`, `lives`,
`quizScore`, `speakingAttempts`, `completionPercentage`, `currentLesson`,
`currentCourse`, `currentSection`, `currentLanguage` — plus the actions that
mutate them. The store itself has no knowledge of persistence; a thin
`persistence/attachPersistence(store)` call (invoked once, at app root)
subscribes to store changes and forwards them to whichever
`PersistenceProvider` is active. This keeps "what the state contains" fully
decoupled from "where it's saved."

## Persistence Provider abstraction (today: localStorage, tomorrow: backend sync)

```ts
// persistence/types.ts
interface PersistenceProvider {
  save(key: string, state: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  clear(key: string): Promise<void>;
}
```

Today: `LocalStorageProvider`. Tomorrow: `ApiPersistenceProvider` (debounced
POST to a sync endpoint). Same factory-swap guarantee as the content/media
providers.

## Error handling

- **Unknown card type** → registry returns `undefined` → renderer shows an
  `UnknownCardFallback`, logs a warning, and still lets the learner advance
  (never blocks the lesson).
- **Invalid/corrupt lesson JSON** → validated against a Zod schema at load
  time inside the content provider; a schema failure surfaces as a typed
  `LessonLoadError`, rendered by an `ErrorBoundary` around `LessonRenderer`
  as a retry/exit screen — never an unhandled crash.
- **Empty lesson** (`cards: []`) → explicit "Nothing to show" state, not a
  blank screen.
- **Missing media** → `MediaService` returns a placeholder asset key rather
  than throwing; `<img>`/`<audio>` elements get `onError` fallbacks.

## Performance

Every `cards/*.tsx` is `React.lazy`-loaded via the registry (the registry
stores a lazy-loading thunk, not an eagerly-imported component), so a
lesson only downloads the card components it actually uses.
`LessonRenderer` wraps the active card in `Suspense`. Card components are
wrapped in `React.memo`; store selectors use Zustand's selector pattern to
avoid whole-store re-renders on every keystroke.

## Testing seams this architecture creates

- Registries are pure maps → trivially unit-testable in isolation.
- `validateCard` is a pure function per validator → unit-testable without
  rendering anything.
- `LessonContentProvider` is an interface → tests use an in-memory fake
  implementing it, no network/FS mocking needed.
- `LessonRenderer` integration tests can inject a fake content provider and
  a minimal set of test-only registered cards, without depending on the
  real 20-card catalog.
