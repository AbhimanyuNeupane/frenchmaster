import type { Request, Response } from "express";
import { lessonService } from "../services/lesson.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type {
  ExerciseIdParam,
  LessonIdParam,
  SubmitExerciseAttemptInput,
} from "../validators/lesson.validators";

export const lessonController = {
  getCourseMap: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await lessonService.getCourseMap(req.user.sub);
    sendSuccess(res, data);
  }),

  getLessonContent: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params as unknown as LessonIdParam;
    const data = await lessonService.getLessonContent(req.user.sub, id);
    sendSuccess(res, data);
  }),

  submitExerciseAttempt: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = req.params as unknown as ExerciseIdParam;
    const { answer } = req.body as SubmitExerciseAttemptInput;
    const result = await lessonService.submitExerciseAttempt(req.user.sub, id, answer);
    sendSuccess(res, result);
  }),
};
