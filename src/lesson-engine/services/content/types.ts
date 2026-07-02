export type { LessonContentProvider } from "../../types";

/**
 * Thrown when a lesson can't be found or fails Zod validation. The
 * LessonErrorBoundary around the renderer catches this and shows a retry/exit
 * screen instead of crashing.
 */
export class LessonLoadError extends Error {
  readonly lessonId: string;
  readonly cause?: unknown;
  constructor(lessonId: string, message: string, cause?: unknown) {
    super(message);
    this.name = "LessonLoadError";
    this.lessonId = lessonId;
    this.cause = cause;
  }
}
