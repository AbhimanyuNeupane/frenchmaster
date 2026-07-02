import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

const validate: CardValidator = (card, response) => {
  if (card.type !== "QuizCard") return { isCorrect: false };
  const answers =
    response && typeof response === "object"
      ? (response as Record<string, string | boolean>)
      : {};
  const key = card.validation.answers;
  const questionIds = card.content.questions.map((q) => q.id);
  const total = questionIds.length;
  const correctCount = questionIds.filter(
    (id) => answers[id] === key[id]
  ).length;
  const score = total ? (correctCount / total) * 100 : 0;
  return {
    isCorrect: correctCount === total,
    score,
    feedback: `You scored ${correctCount}/${total}.`,
  };
};

registerValidator("QuizCard", validate);

export default validate;
