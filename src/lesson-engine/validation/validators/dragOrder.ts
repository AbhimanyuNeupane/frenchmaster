import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "DragOrderCard") return { isCorrect: false };
  const given = Array.isArray(response) ? (response as string[]) : [];
  const expected = card.validation.correctOrder;
  const isCorrect =
    given.length === expected.length &&
    given.every((id, i) => id === expected[i]);
  return {
    isCorrect,
    feedback: isCorrect ? "Perfect order!" : "The order isn't right yet.",
  };
};

registerValidator("DragOrderCard", validate);

export default validate;
