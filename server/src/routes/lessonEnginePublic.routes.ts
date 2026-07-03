import { Router } from "express";
import { lessonEngineController } from "../controllers/lessonEngine.controller";
import { validate } from "../middleware/validate";
import { lessonIdParamSchema, listPublishedLessonsSchema } from "../validators/lessonEngine.validators";

export const lessonEnginePublicRouter = Router();

// Deliberately NO requireAuth — the lesson-engine frontend's public demo
// route intentionally has no auth in this phase, matching the pattern in
// language.routes.ts. Only published, non-deleted lessons are ever returned
// (enforced in lessonEngine.service.ts / lessonEngine.repository.ts).
lessonEnginePublicRouter.get(
  "/lessons",
  validate({ query: listPublishedLessonsSchema }),
  lessonEngineController.listPublishedLessons
);

lessonEnginePublicRouter.get(
  "/lessons/:id",
  validate({ params: lessonIdParamSchema }),
  lessonEngineController.getPublishedLesson
);
