import { Router } from "express";
import { lessonEngineController } from "../controllers/lessonEngine.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  courseIdParamSchema,
  createLessonEngineCourseSchema,
  createLessonEngineLessonSchema,
  lessonIdParamSchema,
  listLessonEngineCoursesSchema,
  listLessonEngineLessonsSchema,
  updateLessonEngineCourseSchema,
  updateLessonEngineLessonSchema,
} from "../validators/lessonEngine.validators";

export const lessonEngineAdminRouter = Router();

// Every route in this file requires admin panel access.
lessonEngineAdminRouter.use(requireAuth, requirePermission("admin.access"));

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

// --- Course / Section hierarchy ---

lessonEngineAdminRouter.get(
  "/courses",
  validate({ query: listLessonEngineCoursesSchema }),
  lessonEngineController.listCourses
);

lessonEngineAdminRouter.post(
  "/courses",
  validate({ body: createLessonEngineCourseSchema }),
  lessonEngineController.createCourse
);

lessonEngineAdminRouter.get(
  "/courses/:id",
  validate({ params: courseIdParamSchema }),
  lessonEngineController.getCourse
);

lessonEngineAdminRouter.patch(
  "/courses/:id",
  validate({ params: courseIdParamSchema, body: updateLessonEngineCourseSchema }),
  lessonEngineController.updateCourse
);

lessonEngineAdminRouter.delete(
  "/courses/:id",
  validate({ params: courseIdParamSchema }),
  lessonEngineController.deleteCourse
);
