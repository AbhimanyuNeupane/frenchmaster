import { Router } from "express";
import { lessonEngineController } from "../controllers/lessonEngine.controller";
import { optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  courseIdParamSchema,
  lessonIdParamSchema,
  listPublishedCoursesSchema,
  listPublishedLessonsSchema,
} from "../validators/lessonEngine.validators";

export const lessonEnginePublicRouter = Router();

// Deliberately NO requireAuth — this surface intentionally has no
// mandatory auth, matching the pattern in language.routes.ts. `optionalAuth`
// still resolves `req.user` WHEN a valid Bearer token is present, so
// content-access gating (Feature C — LessonEngineLesson.requiredRole) can
// compute `locked`/403 correctly, without ever requiring a token. Only
// published, non-deleted lessons/courses are ever returned (enforced in
// lessonEngine.service.ts / lessonEngine.repository.ts); requiredRole
// gating is enforced separately, on top of that.
lessonEnginePublicRouter.use(optionalAuth);

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

lessonEnginePublicRouter.get(
  "/courses",
  validate({ query: listPublishedCoursesSchema }),
  lessonEngineController.listPublishedCourses
);

lessonEnginePublicRouter.get(
  "/courses/:id",
  validate({ params: courseIdParamSchema }),
  lessonEngineController.getPublishedCourse
);
