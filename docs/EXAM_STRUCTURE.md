# Exam Structure — TEF Canada Alignment

The `Exam`/`ExamSection`/`ExamQuestion`/`ExamAttempt`/`ExamSectionResponse`
models in `server/prisma/schema.prisma` are modeled directly on **TEF
Canada** (Test d'Évaluation de Français), the exam most commonly used for
Canadian immigration (Express Entry, CLB scoring) — not the France-based
DELF/DALF that CLAUDE.md's "Exam Mode" section originally referenced. This
was a deliberate pivot per explicit user direction to target the Canadian
immigration use case.

## Real TEF Canada structure (source of truth for section design)

| Section | Skill | Duration | Format | Scoring |
|---|---|---|---|---|
| Compréhension écrite | Reading | 60 min | 50 questions, MCQ | 300 points, auto-graded |
| Expression écrite | Writing | 60 min | 2 tasks (A: continue a news story, 80+ words; B: argue a position, 200+ words) | 450 points, human-graded (2 independent evaluators) |
| Compréhension orale | Listening | 40 min | 60 questions, MCQ | 360 points, auto-graded |
| Expression orale | Speaking | 15 min/candidate | 2 subjects | 450 points, human-graded (live examiner + recorded review) |

Scores map to **CLB (Canadian Language Benchmark) 1-12**, which in turn maps
to CEFR A1-C2. Section B of the writing test is roughly 60% of the writing
score and is what separates CLB 5 from CLB 7 — worth weighting accordingly
if/when a real scoring rubric gets built.

## How the schema maps to this

- `ExamSectionType` enum: `READING_COMPREHENSION`, `WRITING_EXPRESSION`,
  `LISTENING_COMPREHENSION`, `SPEAKING_EXPRESSION` — one `ExamSection` row
  per type, each with its own real `durationMinutes` and `maxScore`.
- `ExamQuestionType`: `multiple_choice` (reading/listening, auto-graded via
  `correctAnswer`), `writing_task` / `speaking_task` (no `correctAnswer` —
  graded later by an admin, `score`/`gradedByUserId`/`gradedAt` on
  `ExamSectionResponse`).
- `ExamAttempt.clbLevel`: set once an attempt is fully graded (all
  human-graded sections scored). No CLB conversion table exists yet — that's
  a real decision to make before this is usable for actual exam prep (see
  open questions below).

## What exists today vs. what's still needed

**Exists**: the schema, and one seeded A2 exam (`seed-exam-a2`) with real
section metadata and one sample auto-graded question each for reading and
listening (see `prisma/seed.ts`).

**Does not exist yet** (out of scope for this pass — see
`docs/BACKEND_STATUS.md`):
- Exam-taking backend flow (start attempt, submit per-question responses,
  timer enforcement, auto-submit on timeout).
- Exam-taking frontend UI.
- Admin authoring UI for exam sections/questions (currently seed-only, same
  as lesson content).
- Writing/speaking human-grading workflow (admin reviews a submission,
  assigns a score).
- The actual CLB conversion table (TEF Canada's real point-to-CLB mapping
  per section — needs to be sourced accurately, not guessed).
- Full question banks for A1/A2/B1/B2 — one sample question per
  auto-graded section exists purely to prove the schema; nowhere near exam-
  ready volume (TEF Canada itself has 50 reading + 60 listening questions
  per real sitting).

## Open questions

1. Is TEF Canada the right target, or should TCF Canada / TEFAQ (Quebec-
   specific) also be supported? They have different section structures and
   CLB mappings.
2. Should writing/speaking grading be assisted by AI (a first-pass score an
   admin reviews/overrides) given CLAUDE.md's "AI for mistake analysis"
   goal, or purely manual to start?
3. Timer enforcement — server-authoritative (reject responses submitted
   after `durationMinutes` elapsed) or client-trusted for a first version?
