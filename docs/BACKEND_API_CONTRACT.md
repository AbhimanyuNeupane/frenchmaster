# Backend API Contract — Dashboard (v1)

This documents what the frontend currently expects from the backend for the
**Dashboard** screen, so the backend can be implemented against a stable
contract. The frontend is currently running against the static fixture in
[`src/lib/mock-data.ts`](../src/lib/mock-data.ts), typed by
[`src/types/index.ts`](../src/types/index.ts). Treat those two files as the
source of truth for shape — this doc explains the intent behind them.

## Scope

Only the Dashboard is wired up today. The rest of the sidebar sections
(Learn, Vocabulary, Grammar, Listening, Speaking, Reading, Writing, Practice,
Exam, Achievements, Certificates, Progress, Settings, Profile) are empty
states with no data dependency yet — no contract needed for those until the
frontend builds their real screens.

## Endpoint needed

```
GET /api/dashboard
Authorization: Bearer <JWT access token>
```

Returns a single `DashboardData` object (see
[`src/types/index.ts`](../src/types/index.ts)):

```ts
interface DashboardData {
  user: UserProfile;
  streak: StreakInfo;
  xp: XpSummary;
  continueLesson: LessonSummary;
  todaysLesson: LessonSummary;
  skillScores: SkillScore[];
  weakTopics: WeakTopic[];
  achievements: Achievement[];
  upcomingExam: UpcomingExam | null;
  studyTimeMinutesThisWeek: number;
  vocabularyLearned: number;
}
```

All the nested interfaces (`UserProfile`, `StreakInfo`, `XpSummary`,
`LessonSummary`, `SkillScore`, `WeakTopic`, `Achievement`, `UpcomingExam`) are
defined in that same file with field-level comments implied by naming —
nothing is optional except `upcomingExam` (nullable when no exam is
scheduled for the user's current level) and `user.avatarUrl` (nullable).

## Notes on semantics, derived from the mock data

- `streak.last7Days` is a fixed-length 7-item boolean array, oldest-to-newest
  (Mon → Sun in the mock), `true` if the user's `goalMinutesPerDay` was met
  that day. The frontend does not compute this — send it pre-computed.
- `xp.xpIntoLevel` / `xp.xpForNextLevel` drive a progress bar for the user's
  current XP level (separate concept from `user.levelProgress`, which is
  progress through the current CEFR level, e.g. A2).
- `continueLesson` is the most recently in-progress lesson (`progress` between
  1–99). `todaysLesson` is the next recommended lesson chosen by whatever
  adaptive-learning logic exists (can be `progress: 0`).
- `skillScores[].key` is a closed enum: `pronunciation | grammar | listening |
  reading | speaking | vocabulary`. The frontend expects all six keys present
  every time so it can render fixed rows without conditional logic.
- `weakTopics` should be ordered by priority (worst first) — the frontend just
  renders in array order. 3–5 items is the expected typical length.
- `achievements` returned here is a small "highlights" set for the dashboard
  widget (expect ~4), not the full badge list — that's a separate concern for
  the future `/achievements` page.
- `upcomingExam.sectionsReady` / `sectionsTotal` reflects exam-content
  readiness (e.g. listening/speaking/reading/writing sections published),
  not the user's personal exam-prep progress.

## Auth

Standard JWT bearer auth per `CLAUDE.md` (`JWT_SECRET` / refresh token flow).
No dashboard-specific auth behavior beyond "401 if no/invalid token."

## Open questions for backend design (not blocking frontend work)

- Should skill scores be computed live per-request or cached/materialized
  (e.g. recomputed nightly)? Affects whether this endpoint needs to stay
  cheap or can do heavier aggregation.
- Where does "today" reset relative to for streak/goal purposes — user's
  local timezone or server UTC day boundary? Needs to be consistent with
  whatever the future `/practice` (spaced repetition) and streak-tracking
  logic uses.
