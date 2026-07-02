import type { LessonContentProvider } from "../../types";
import { LocalJsonContentProvider } from "./localJsonProvider";

export type ContentBackend = "local" | "api";

/** Currently hardcoded to the local JSON backend. This is the ONE place a
 *  future API/S3 content provider gets wired in — no other file references a
 *  concrete provider by name. */
const ACTIVE_BACKEND: ContentBackend = "local";

let instance: LessonContentProvider | null = null;

/**
 * Factory + singleton. Everything reaches content through `getContentProvider()`
 * (and, in components, through the useLesson/useCourse React Query hooks).
 * Changing providers later is a one-file change here.
 */
export function getContentProvider(): LessonContentProvider {
  if (instance) return instance;
  switch (ACTIVE_BACKEND) {
    case "local":
    default:
      instance = new LocalJsonContentProvider();
  }
  return instance;
}

export { LocalJsonContentProvider };
export { LessonLoadError } from "./types";
