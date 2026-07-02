import { registerValidator } from "../../registry/validatorRegistry";
import type { CardValidator } from "../../types";

/**
 * PLACEHOLDER scoring. Real speech recognition (Whisper/Deepgram/Google) is a
 * future phase; this is the seam where that call will live. For now it returns
 * a fixed-range placeholder score and always passes so the learner can proceed.
 * Swap the body for a real ASR-backed scorer without touching any card or the
 * engine.
 */
const validate: CardValidator = (card, _response) => {
  if (card.type !== "SpeakingCard") return { isCorrect: false };
  // Seeded-ish placeholder in the 82–98 range; deterministic enough for demos.
  const score = 82 + Math.floor(Math.random() * 17);
  return {
    isCorrect: true,
    score,
    feedback: `Nice! Placeholder pronunciation score: ${score}/100.`,
  };
};

registerValidator("SpeakingCard", validate);

export default validate;
