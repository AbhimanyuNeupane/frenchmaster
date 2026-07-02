import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "ListeningCard") return { isCorrect: false };
  const isCorrect = response === card.validation.correctOptionId;
  return {
    isCorrect,
    feedback: isCorrect ? "Correct!" : "Listen again and try to catch it.",
  };
};

registerValidator("ListeningCard", validate);

export default validate;
