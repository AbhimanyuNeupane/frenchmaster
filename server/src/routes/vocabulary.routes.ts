import { Router } from "express";
import { vocabularyController } from "../controllers/vocabulary.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listVocabularySchema, vocabularyIdParamSchema } from "../validators/vocabulary.validators";

export const vocabularyRouter = Router();

vocabularyRouter.get(
  "/",
  requireAuth,
  validate({ query: listVocabularySchema }),
  vocabularyController.getVocabulary
);

vocabularyRouter.get("/categories", requireAuth, vocabularyController.getCategories);

vocabularyRouter.post(
  "/:id/favorite",
  requireAuth,
  validate({ params: vocabularyIdParamSchema }),
  vocabularyController.toggleFavorite
);

vocabularyRouter.post(
  "/:id/review",
  requireAuth,
  validate({ params: vocabularyIdParamSchema }),
  vocabularyController.markReviewed
);
