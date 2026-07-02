import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

/**
 * Correctness is DERIVED from the pairs in `content` (a correct match is
 * leftId === rightId, since both come from the same pair). MatchingCard has no
 * separate `validation` payload — the pairs are the single source of truth.
 */
const validate: CardValidator = (card, response) => {
  if (card.type !== "MatchingCard") return { isCorrect: false };
  const mapping =
    response && typeof response === "object"
      ? (response as Record<string, string>)
      : {};
  const pairs = card.content.pairs;
  const correctCount = pairs.filter((p) => mapping[p.id] === p.id).length;
  const isCorrect = correctCount === pairs.length;
  return {
    isCorrect,
    score: pairs.length ? (correctCount / pairs.length) * 100 : 0,
    feedback: isCorrect
      ? "All matched!"
      : `${correctCount} of ${pairs.length} matched.`,
  };
};

registerValidator("MatchingCard", validate);

export default validate;
