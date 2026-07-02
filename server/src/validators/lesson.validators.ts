import { z } from "zod";
import { idSchema } from "./common";

export const lessonIdParamSchema = z.object({
  id: idSchema,
});

export const exerciseIdParamSchema = z.object({
  id: idSchema,
});

export const submitExerciseAttemptSchema = z.object({
  answer: z.string().trim().min(1).max(2000),
});

export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;
export type ExerciseIdParam = z.infer<typeof exerciseIdParamSchema>;
export type SubmitExerciseAttemptInput = z.infer<typeof submitExerciseAttemptSchema>;
