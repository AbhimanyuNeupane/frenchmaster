# Universal Lesson Engine

A generic, card-based, **language-agnostic** lesson player driven entirely by
local JSON, with a plugin/registry architecture so new card types never require
touching the renderer, navigation, or validation engines.

## 10-second orientation

- Host route (demo): `/lesson-engine` — a picker; `/lesson-engine/<lessonId>`
  plays a lesson. Both French and Spanish lessons render through the identical
  UI and code.
- Public entry point: `engine/LessonRenderer.tsx` (`<LessonRenderer lessonId />`).
- **Adding a card type = 2 edits:** create `cards/YourCard.tsx` (self-registers)
  and add one import line to `cards/index.ts`. If it validates, add
  `validation/validators/yourCard.ts` and one line to that barrel. Nothing else
  changes.

## The real depth lives in two files

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the binding design: layering,
  registries, provider seams, error handling, performance, testing seams.
- [`FOLDER_STRUCTURE.md`](./FOLDER_STRUCTURE.md) — where everything lives and why.

## Swap-in seams (each is a one-file change)

| Concern      | Today                     | Change here                         |
| ------------ | ------------------------- | ----------------------------------- |
| Content      | local JSON                | `services/content/index.ts`         |
| Media        | `public/lesson-assets/`   | `services/media/index.ts`           |
| Persistence  | `localStorage`            | `persistence/attachPersistence.ts`  |

Every module directory has its own `README.md` with its extension point.
