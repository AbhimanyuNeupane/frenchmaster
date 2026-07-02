import type { LessonCard } from "./card";

/**
 * The uniform result every validator returns. `score` is a 0–100 number when a
 * card produces one (quizzes, speaking placeholder); `feedback` is an optional
 * human-readable hint surfaced by the renderer.
 */
export interface ValidationResult {
  isCorrect: boolean;
  score?: number;
  feedback?: string;
}

/**
 * A validator is a pure function of (card, rawUserResponse) -> ValidationResult.
 * It is looked up by `card.type` in the validator registry. Cards never call
 * validators themselves — the engine does — which keeps the card/validator
 * boundary real rather than merely documented.
 */
export type CardValidator = (
  card: LessonCard,
  response: unknown
) => ValidationResult;
