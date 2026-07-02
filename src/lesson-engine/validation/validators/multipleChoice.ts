import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "MultipleChoiceCard") return { isCorrect: false };
  const isCorrect = response === card.validation.correctOptionId;
  return {
    isCorrect,
    feedback: isCorrect ? "Correct!" : "Not quite — review the options.",
  };
};

registerValidator("MultipleChoiceCard", validate);

export default validate;
