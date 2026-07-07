import type { Request, Response } from "express";
import { lessonEngineService } from "../services/lessonEngine.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import type {
  CourseIdParam,
  CreateLessonEngineCourseInput,
  CreateLessonEngineLessonInput,
  LessonIdParam,
  ListLessonEngineCoursesQuery,
  ListLessonEngineLessonsQuery,
  ListPublishedCoursesQuery,
  ListPublishedLessonsQuery,
  UpdateLessonEngineCourseInput,
  UpdateLessonEngineLessonInput,
} from "../validators/lessonEngine.validators";

// Same convention as admin.controller.ts: `validate()` has already
// overwritten req.query/req.params/req.body with the Zod-parsed values at
// runtime; the casts below just reflect that at the type level.
export const lessonEngineController = {
  // --- Admin: Lessons ---

  listLessons: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListLessonEngineLessonsQuery;
    const data = await lessonEngineService.listLessons(query);
    sendSuccess(res, data);
  }),

  getLesson: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as LessonIdParam;
    const lesson = await lessonEngineService.getLessonForAdmin(id);
    sendSuccess(res, lesson);
  }),

  createLesson: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateLessonEngineLessonInput;
    const lesson = await lessonEngineService.createLesson(input);
    sendSuccess(res, lesson, "Lesson created", 201);
  }),

  updateLesson: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as LessonIdParam;
    const input = req.body as UpdateLessonEngineLessonInput;
    const lesson = await lessonEngineService.updateLesson(id, input);
    sendSuccess(res, lesson, "Lesson updated");
  }),

  deleteLesson: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as LessonIdParam;
    await lessonEngineService.deleteLesson(id);
    sendSuccess(res, null, "Lesson deleted");
  }),

  // No `validate()` middleware on this route on purpose — see
  // lessonEngine.service.ts validateDraft for why a hard 422 here would
  // defeat the point of a dry-run.
  validateLessonDraft: asyncHandler(async (req: Request, res: Response) => {
    const result = lessonEngineService.validateDraft(req.body);
    sendSuccess(res, result);
  }),

  // --- Public: Lessons ---
  //
  // `req.user?.permissions` is populated only when `optionalAuth` found a
  // valid, ACTIVE-account session — undefined for a genuinely anonymous request.

  listPublishedLessons: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListPublishedLessonsQuery;
    const lessons = await lessonEngineService.listPublishedLessons(query, req.user?.permissions);
    sendSuccess(res, lessons);
  }),

  getPublishedLesson: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as LessonIdParam;
    const lesson = await lessonEngineService.getPublishedLesson(id, req.user?.permissions);
    sendSuccess(res, lesson);
  }),

  // --- Admin: Courses ---

  listCourses: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListLessonEngineCoursesQuery;
    const data = await lessonEngineService.listCoursesForAdmin(query);
    sendSuccess(res, data);
  }),

  getCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as CourseIdParam;
    const course = await lessonEngineService.getCourseForAdmin(id);
    sendSuccess(res, course);
  }),

  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateLessonEngineCourseInput;
    const course = await lessonEngineService.createCourse(input);
    sendSuccess(res, course, "Course created", 201);
  }),

  updateCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as CourseIdParam;
    const input = req.body as UpdateLessonEngineCourseInput;
    const course = await lessonEngineService.updateCourse(id, input);
    sendSuccess(res, course, "Course updated");
  }),

  deleteCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as CourseIdParam;
    await lessonEngineService.deleteCourse(id);
    sendSuccess(res, null, "Course deleted");
  }),

  // --- Public: Courses ---

  listPublishedCourses: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListPublishedCoursesQuery;
    const courses = await lessonEngineService.listPublishedCourses(query);
    sendSuccess(res, courses);
  }),

  getPublishedCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as CourseIdParam;
    const course = await lessonEngineService.getPublishedCourse(id, req.user?.permissions);
    sendSuccess(res, course);
  }),
};
