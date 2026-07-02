import { registerValidator } from "../../registry/validatorRegistry";
import { fuzzyEquals, normalizeAnswer } from "../../utils/fuzzy";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "WritingCard") return { isCorrect: false };
  const given = String(response ?? "");
  const normalized = normalizeAnswer(given);
  const { acceptedAnswers, fuzzyMatch } = card.validation;

  const isCorrect =
    normalized.length > 0 &&
    acceptedAnswers.some((ans) =>
      fuzzyMatch
        ? fuzzyEquals(given, ans)
        : normalizeAnswer(ans) === normalized
    );

  return {
    isCorrect,
    feedback: isCorrect
      ? "Well written!"
      : `A model answer: ${acceptedAnswers[0] ?? ""}`,
  };
};

registerValidator("WritingCard", validate);

export default validate;
