# navigation/

`useLessonNavigation(lesson, { onExit })` — the positional engine:
`next / previous / skip / restart / resume / exit`, plus derived
`progressPercent` and `estimatedTimeRemaining` (sums remaining cards'
`metadata.estimatedSeconds`, degrading to a per-card-count estimate when absent).

**Key design point:** the current card index lives in `store/useLessonStore`,
**not** local component state — so navigation survives remounts and is what
persistence captures. This hook is card-type agnostic; it only knows there's an
ordered list and a current index.

**Dependencies:** `store/`, `types/`.

**Extension point:** to add a navigation behavior (e.g. jump-to-card, bookmark),
add a method here backed by a store action — no card or engine changes needed.
