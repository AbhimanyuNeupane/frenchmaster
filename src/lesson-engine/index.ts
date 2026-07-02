/**
 * Public surface of the Universal Lesson Engine. Host apps import from here.
 * See ARCHITECTURE.md and FOLDER_STRUCTURE.md for the full design.
 */
export { LessonRenderer } from "./engine";
export type { LessonRendererProps } from "./engine";
export { useLesson, useCourse, useLessonList, useMediaService } from "./hooks";
export { attachPersistence } from "./persistence";
export { getContentProvider, LessonLoadError } from "./services/content";
export { getMediaService } from "./services/media";
export { useLessonStore } from "./store/useLessonStore";
export { validateCard, isValidatingCard } from "./validation";
export {
  registerCardComponent,
  getCardComponent,
  registerValidator,
  getValidator,
} from "./registry";
export type * from "./types";
