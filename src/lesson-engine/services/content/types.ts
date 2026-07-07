export type { LessonContentProvider } from "../../types";

/**
 * Thrown when a lesson can't be found or fails Zod validation. The
 * LessonErrorBoundary around the renderer catches this and shows a retry/exit
 * screen instead of crashing.
 *
 * `requiredPermissionKey` distinguishes a *gated* lesson (the content exists
 * but the requester's role lacks the permission — a 403 from the backend)
 * from a broken/missing one. When set, the boundary shows a
 * "requires the X permission" message instead of the generic corrupt-data
 * retry framing.
 */
export class LessonLoadError extends Error {
  readonly lessonId: string;
  readonly cause?: unknown;
  readonly requiredPermissionKey?: string;
  constructor(lessonId: string, message: string, cause?: unknown, requiredPermissionKey?: string) {
    super(message);
    this.name = "LessonLoadError";
    this.lessonId = lessonId;
    this.cause = cause;
    this.requiredPermissionKey = requiredPermissionKey;
  }
}
