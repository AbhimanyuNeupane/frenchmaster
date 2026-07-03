import type { Pagination } from "@/types/admin";

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
}

/** Response from `POST /api/admin/lesson-engine/lessons/validate` (dry-run, writes nothing). */
export interface ValidateLessonDraftResponse {
  valid: boolean;
  errors: string[];
}
