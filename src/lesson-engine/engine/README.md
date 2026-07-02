# engine/

`LessonRenderer.tsx` — the module's single public entry point:
`<LessonRenderer lessonId onExit />`.

**Responsibilities (orchestration only):** load the lesson (`useLesson`), read
the current index from `navigation/`, resolve the card component from the
`registry`, render it in `Suspense` + `CardShell`, and wire the card's
`onSubmit` through `validation/` into `store/`. Renders header (progress,
hearts, XP), footer (skip/continue), completion screen, and delegates errors to
`LessonErrorBoundary`.

**Hard rule:** contains **zero** card-type-specific logic — no `switch
(card.type)`, no card-type literal strings. Whether a card must be answered
before advancing is decided by `isValidatingCard(card)` (a registry lookup), not
by naming a type.

**Dependencies:** `registry/`, `validation/`, `navigation/`, `store/`, `hooks/`,
`components/`, `types/`.

**Extension point:** you should never need to edit this file to support a new
card type. If you find yourself wanting to, the abstraction is being violated —
fix the registry/validator instead.
