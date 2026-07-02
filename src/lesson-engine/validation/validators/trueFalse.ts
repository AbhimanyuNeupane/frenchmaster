import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "TrueFalseCard") return { isCorrect: false };
  const isCorrect = response === card.validation.answer;
  return {
    isCorrect,
    feedback: isCorrect ? "Correct!" : "Not quite.",
  };
};

registerValidator("TrueFalseCard", validate);

export default validate;
