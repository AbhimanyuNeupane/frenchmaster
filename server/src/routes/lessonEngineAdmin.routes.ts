import { Router } from "express";
import { lessonEngineController } from "../controllers/lessonEngine.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createLessonEngineLessonSchema,
  lessonIdParamSchema,
  listLessonEngineLessonsSchema,
  updateLessonEngineLessonSchema,
} from "../validators/lessonEngine.validators";

export const lessonEngineAdminRouter = Router();

// Every route in this file is admin-only.
lessonEngineAdminRouter.use(requireAuth, requireRole("ADMIN"));

lessonEngineAdminRouter.get(
  "/lessons",
  validate({ query: listLessonEngineLessonsSchema }),
  lessonEngineController.listLessons
);

// Static sub-path registered ahead of the ":id" dynamic segment purely for
// readability — POST "/lessons/validate" and POST "/lessons" are distinct
// paths so there's no actual Express route-precedence hazard here.
lessonEngineAdminRouter.post("/lessons/validate", lessonEngineController.validateLessonDraft);

lessonEngineAdminRouter.post(
  "/lessons",
  validate({ body: createLessonEngineLessonSchema }),
  lessonEngineController.createLesson
);

lessonEngineAdminRouter.get(
  "/lessons/:id",
  validate({ params: lessonIdParamSchema }),
  lessonEngineController.getLesson
);

lessonEngineAdminRouter.patch(
  "/lessons/:id",
  validate({ params: lessonIdParamSchema, body: updateLessonEngineLessonSchema }),
  lessonEngineController.updateLesson
);

lessonEngineAdminRouter.delete(
  "/lessons/:id",
  validate({ params: lessonIdParamSchema }),
  lessonEngineController.deleteLesson
);
