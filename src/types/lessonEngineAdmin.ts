import type { Pagination } from "@/types/admin";

/**
 * Content-gating role for a lesson. `null` = fully public (the default) — free
 * for everyone. A non-null value means the learner must have that role (or
 * higher) to play the lesson. Mirrors the backend's `requiredRole` enum.
 */
export type LessonRequiredRole =
  | "USER"
  | "PREMIUM"
  | "MODERATOR"
  | "ADMIN"
  | null;

/**
 * Admin-facing types for the lesson-engine CRUD API
 * (`/api/admin/lesson-engine/**`). Kept separate from `types/admin.ts` because
 * this is a different data domain — the language-agnostic lesson-engine content,
 * not the French vocabulary catalog.
 *
 * `cards` is deliberately typed loosely (`unknown[]`) here: the admin editor
 * works with raw, in-progress JSON that may not yet be a valid lesson. Real,
 * strict typing happens only when a draft is run through the engine's
 * `lessonSchema` (client-side, before Validate/Save).
 */

/** List-item projection from `GET /api/admin/lesson-engine/lessons` (no `cards`). */
export interface AdminLessonEngineLessonSummary {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  cardCount: number;
  published: boolean;
  requiredRole: LessonRequiredRole;
  createdAt: string;
  updatedAt: string;
}

/** Full detail from `GET /api/admin/lesson-engine/lessons/:id` (adds raw `cards`). */
export interface AdminLessonEngineLessonDetail
  extends AdminLessonEngineLessonSummary {
  cards: unknown[];
}

export interface AdminLessonEngineListResponse {
  lessons: AdminLessonEngineLessonSummary[];
  pagination: Pagination;
}

/**
 * Body for create (`POST`) and update (`PATCH`). `id` is only sent on create —
 * it's immutable server-side, so the update path omits it.
 */
export interface LessonEngineLessonPayload {
  id?: string;
  language: string;
  level: string;
  title: string;
  description?: string;
  cards: unknown[];
  published: boolean;
  requiredRole: LessonRequiredRole;
}

/** Response from `POST /api/admin/lesson-engine/lessons/validate` (dry-run, writes nothing). */
export interface ValidateLessonDraftResponse {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Courses (`/api/admin/lesson-engine/courses/**`)
// ---------------------------------------------------------------------------

/** List-item projection from `GET /api/admin/lesson-engine/courses` (no sections). */
export interface AdminLessonEngineCourseSummary {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  published: boolean;
  displayOrder: number;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A lesson embedded in a course section (read shape from course detail). */
export interface AdminLessonEngineCourseSectionLesson {
  id: string;
  title: string;
  language: string;
  level: string;
  cardCount: number;
  published: boolean;
  requiredRole: LessonRequiredRole;
  displayOrder: number;
}

/** A section in a course's detail read shape (lessons embedded, ordered). */
export interface AdminLessonEngineCourseSection {
  id: string;
  title: string;
  displayOrder: number;
  lessons: AdminLessonEngineCourseSectionLesson[];
}

/** Full detail from `GET /api/admin/lesson-engine/courses/:id`. */
export interface AdminLessonEngineCourseDetail {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  published: boolean;
  displayOrder: number;
  sections: AdminLessonEngineCourseSection[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminLessonEngineCourseListResponse {
  courses: AdminLessonEngineCourseSummary[];
  pagination: Pagination;
}

/**
 * A section in the WRITE shape (create/update body). Unlike the read shape,
 * lessons are referenced by id only, ordered — index in `lessonIds` is the
 * display order within the section. `id` is optional (present when editing an
 * existing section). `sections` is always a FULL REPLACE on update.
 */
export interface LessonEngineCourseSectionPayload {
  id?: string;
  title: string;
  displayOrder: number;
  lessonIds: string[];
}

/**
 * Body for course create (`POST`) and update (`PATCH`). `id` is only sent on
 * create — immutable server-side. `sections`, when sent, replaces the entire
 * section/lesson-link structure.
 */
export interface LessonEngineCoursePayload {
  id?: string;
  language: string;
  level: string;
  title: string;
  description?: string;
  published: boolean;
  displayOrder: number;
  sections: LessonEngineCourseSectionPayload[];
}
