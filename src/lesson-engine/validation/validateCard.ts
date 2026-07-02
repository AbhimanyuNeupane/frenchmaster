import { getValidator } from "../registry/validatorRegistry";
import type { LessonCard, ValidationResult } from "../types";

/**
 * The validation engine. Looks up a validator by `card.type` and calls it. This
 * function contains ZERO card-type-specific logic and no `switch (card.type)` —
 * "MultipleChoiceCard" etc. exist only as registry keys inside the validator
 * files, never here.
 *
 * A card with no registered validator is an auto-pass: this is a property of
 * "no validator", not a per-type special case the engine hardcodes. Display
 * cards (Text, Image, Info, Summary, Reward, …) simply register no validator.
 */
export function validateCard(
  card: LessonCard,
  response: unknown
): ValidationResult {
  const validator = getValidator(card.type);
  if (!validator) {
    return { isCorrect: true };
  }
  return validator(card, response);
}

/** Whether a card type participates in validation (has a registered validator).
 *  The renderer uses this to decide if a card must be answered before advancing
 *  — again without ever naming a concrete card type. */
export function isValidatingCard(card: LessonCard): boolean {
  return getValidator(card.type) !== undefined;
}
