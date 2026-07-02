import { registerValidator } from "../../registry/validatorRegistry";
import { normalizeAnswer } from "../../utils/fuzzy";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "FillBlankCard") return { isCorrect: false };
  const given = normalizeAnswer(String(response ?? ""));
  const accepted = card.validation.acceptedAnswers.map(normalizeAnswer);
  const isCorrect = given.length > 0 && accepted.includes(given);
  return {
    isCorrect,
    feedback: isCorrect
      ? "Correct!"
      : `Expected: ${card.validation.acceptedAnswers[0] ?? ""}`,
  };
};

registerValidator("FillBlankCard", validate);

export default validate;
