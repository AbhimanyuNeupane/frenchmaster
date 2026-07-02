import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "MultipleSelectCard") return { isCorrect: false };
  const picked = Array.isArray(response) ? (response as string[]) : [];
  const expected = card.validation.correctOptionIds;
  const a = new Set(picked);
  const b = new Set(expected);
  const isCorrect = a.size === b.size && [...a].every((id) => b.has(id));
  return {
    isCorrect,
    feedback: isCorrect ? "All correct!" : "Some selections are off.",
  };
};

registerValidator("MultipleSelectCard", validate);

export default validate;
