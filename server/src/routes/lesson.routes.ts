import { Router } from "express";
import { lessonController } from "../controllers/lesson.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  exerciseIdParamSchema,
  lessonIdParamSchema,
  submitExerciseAttemptSchema,
} from "../validators/lesson.validators";

export const lessonRouter = Router();

lessonRouter.use(requireAuth);

lessonRouter.get("/units", lessonController.getCourseMap);
lessonRouter.get("/:id", validate({ params: lessonIdParamSchema }), lessonController.getLessonContent);
lessonRouter.post(
  "/exercises/:id/attempt",
  validate({ params: exerciseIdParamSchema, body: submitExerciseAttemptSchema }),
  lessonController.submitExerciseAttempt
);
