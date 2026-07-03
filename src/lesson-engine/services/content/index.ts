import type { LessonContentProvider } from "../../types";
import { LocalJsonContentProvider } from "./localJsonProvider";
import { ApiContentProvider } from "./apiProvider";

export type ContentBackend = "local" | "api";

/** The ONE place the active content backend is chosen. `LocalJsonContentProvider`
 *  is kept fully intact (and still exported) as the bundled-sample fallback; the
 *  real backend now exists, so the API provider is the default. Flip this to
 *  `"local"` to run entirely offline against `data/lessons/**`. */
const ACTIVE_BACKEND: ContentBackend = "api";

let instance: LessonContentProvider | null = null;

/**
 * Factory + singleton. Everything reaches content through `getContentProvider()`
 * (and, in components, through the useLesson/useCourse React Query hooks).
 * Changing providers later is a one-file change here.
 */
export function getContentProvider(): LessonContentProvider {
  if (instance) return instance;
  switch (ACTIVE_BACKEND) {
    case "api":
      instance = new ApiContentProvider();
      break;
    case "local":
    default:
      instance = new LocalJsonContentProvider();
  }
  return instance;
}

export { LocalJsonContentProvider, ApiContentProvider };
export { LessonLoadError } from "./types";
