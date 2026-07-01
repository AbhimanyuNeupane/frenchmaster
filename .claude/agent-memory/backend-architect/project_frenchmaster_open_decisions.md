---
name: frenchmaster-open-decisions
description: Unresolved design decisions flagged during initial FrenchMaster backend build that need human sign-off
metadata:
  type: project
---

These were implemented with a documented default so the build wasn't
blocked, but need explicit human confirmation before being treated as
final. Each is also flagged with a comment at its source in the code.

1. **XP leveling curve formula** — `server/src/utils/xpCurve.ts`. Chose
   `xpCostForLevel(n) = 100 * n^2` (quadratic, gently accelerating). Never
   validated against real engagement/design targets.
2. **Streak/goal day-boundary timezone** — `server/src/utils/dateUtils.ts`.
   Chose UTC midnight (not user-local time) for `DailyActivity` bucketing
   and streak computation. Contract doc explicitly flagged this as open.
   If per-user timezones are required, `DailyActivity` needs a
   write-time-aware bucketing strategy, not a read-time fix.
3. **`upcomingExam.sectionsReady`/`sectionsTotal` modeling** — modeled as
   two plain integer counters directly on the `Exam` row (no child
   `ExamSection` table), because exam content authoring doesn't exist yet.
   Documented as the natural upgrade path once authoring is built.
4. **Skill scores: live-computed vs. materialized** — contract doc raised
   this as an open question affecting whether the dashboard endpoint needs
   to stay cheap. Currently implemented as a materialized `SkillScoreSnapshot`
   table (latest score per user+skill, upserted by whatever future scoring
   event writes to it) — dashboard just reads the latest snapshot, doesn't
   recompute. No real scoring event producer exists yet (out of scope).
5. **OAuth credentials** — Google/Apple client IDs/secrets don't exist.
   Routes are 501 stubs (`server/src/controllers/auth.controller.ts`).
6. **Storage provider** — Supabase vs Cloudflare R2 undecided; CLAUDE.md
   lists both as options. Not used yet (no file upload features built).
7. **`vocabularyLearned` metric** — approximated as count of distinct
   vocabulary-skill topics with at least one attempt (via `MistakeLog`
   distinct topicTitle), not a dedicated "words learned" tracking table.
   Flagged in `server/src/repositories/dashboard.repository.ts` as a
   placeholder — a real vocabulary SRS system would need its own table.

See [[project-frenchmaster-backend]] for overall scope context.
