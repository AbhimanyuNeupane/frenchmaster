# store/

`useLessonStore` — a single Zustand store holding the lesson-session state
listed in `ARCHITECTURE.md` (`currentCard`, `completedCards`, `correctAnswers`,
`wrongAnswers`, `xp`, `hearts`, `lives`, `quizScore`, `speakingAttempts`,
`completionPercentage`, `currentLesson/Course/Section/Language`) plus the actions
that mutate them (`startLesson`, `advanceCard`, `recordCorrect/Wrong`, `addXp`,
`loseHeart`, …).

**Design point:** the store knows **nothing** about persistence — "what the
state contains" is fully decoupled from "where it's saved". Consumers subscribe
narrowly via Zustand selectors (`useLessonStore(s => s.xp)`) to avoid
whole-store re-renders.

**Dependencies:** `zustand`, `types/`.

**Extension point:** add a field + its action here; persistence picks it up
automatically if you add the key to `SESSION_KEYS` in
`persistence/attachPersistence.ts`.
