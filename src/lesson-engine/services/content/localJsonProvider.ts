import type {
  Course,
  CourseSummary,
  Lesson,
  LessonContentProvider,
  LessonSummary,
} from "../../types";
import {
  COURSE_MANIFEST,
  LESSON_MANIFEST,
} from "../../data/lessons";
import { lessonSchema } from "./schema";
import { LessonLoadError } from "./types";

/**
 * Reads lessons from bundled local JSON via the manifest, validating each
 * against the Zod schema before handing it back. Any not-found or
 * schema-invalid lesson throws a typed LessonLoadError. Swap this class for an
 * API/S3 provider in services/content/index.ts and nothing else changes.
 */
export class LocalJsonContentProvider implements LessonContentProvider {
  async getLesson(id: string): Promise<Lesson> {
    const entry = LESSON_MANIFEST[id];
    if (!entry) {
      throw new LessonLoadError(id, `Lesson "${id}" was not found.`);
    }

    let raw: unknown;
    try {
      const mod = await entry.load();
      raw = mod.default ?? mod;
    } catch (err) {
      throw new LessonLoadError(id, `Failed to load lesson "${id}".`, err);
    }

    const parsed = lessonSchema.safeParse(raw);
    if (!parsed.success) {
      throw new LessonLoadError(
        id,
        `Lesson "${id}" failed validation: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
        parsed.error
      );
    }
    // The parsed shape matches the LessonCard union by construction.
    return parsed.data as Lesson;
  }

  async listLessons(filter: {
    language?: string;
    level?: string;
  }): Promise<LessonSummary[]> {
    return Object.values(LESSON_MANIFEST)
      .map((e) => e.summary)
      .filter((s) => {
        if (filter.language && s.language !== filter.language) return false;
        if (filter.level && s.level !== filter.level) return false;
        return true;
      });
  }

  async getCourse(id: string): Promise<Course> {
    const course = COURSE_MANIFEST[id];
    if (!course) {
      throw new LessonLoadError(id, `Course "${id}" was not found.`);
    }
    return course;
  }

  async listCourses(filter: {
    language?: string;
    level?: string;
  }): Promise<CourseSummary[]> {
    return Object.values(COURSE_MANIFEST)
      .filter((c) => {
        if (filter.language && c.language !== filter.language) return false;
        if (filter.level && c.level !== filter.level) return false;
        return true;
      })
      .map(({ sections: _sections, ...summary }) => summary);
  }
}
