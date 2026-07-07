import { z } from "zod";

/**
 * Structural-only validation for LessonEngineLesson.cardsJson.
 *
 * The lesson-engine frontend's `src/lesson-engine/services/content/schema.ts`
 * (a separate Next.js package this server cannot import from) owns the full,
 * strict, discriminated-union validation over all 21 card types — each with
 * its own `content`/`validation` shape. Replicating that entire union here
 * would create two sources of truth for the same schema that would
 * inevitably drift. This schema only guards against obviously malformed data
 * reaching the database: missing envelope fields, an empty card array, or
 * duplicate card ids within a lesson. Full per-card-type validation happens
 * client-side in the admin UI (using the real engine schema) before an admin
 * ever submits, and again inside the frontend's `ApiContentProvider` before a
 * lesson reaches the player.
 */
const cardSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.string().trim().min(1),
    title: z.string().optional(),
    content: z.unknown(),
    media: z.array(z.unknown()).optional(),
    actions: z.array(z.unknown()).optional(),
    validation: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const cardsArraySchema = z
  .array(cardSchema)
  .min(1, "At least one card is required")
  .refine((cards) => new Set(cards.map((c) => c.id)).size === cards.length, {
    message: "Duplicate card id within the lesson",
  });

export const lessonIdParamSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

/**
 * Content-access gating (see LessonEngineLesson.requiredPermissionKey in
 * schema.prisma / utils/permissions.ts). `null` = fully public — the
 * default, matching the feature's original no-auth design. References
 * Permission.key — a dynamic, admin-managed catalog (see GET
 * /api/admin/permissions) — so this is a free-form string, not a fixed
 * enum; existence isn't validated here (Zod has no DB access), same
 * convention as translations' languageCode elsewhere in this codebase.
 */
const requiredPermissionKeySchema = z.string().trim().min(1).max(100).nullable().optional();

export const createLessonEngineLessonSchema = z.object({
  // Admin-chosen slug, immutable after creation — matches the engine's own
  // Lesson.id (e.g. "fr_a1_lesson_002").
  id: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, underscore, hyphen only"),
  // Opaque codes, never enums — the engine is language/level-agnostic.
  language: z.string().trim().min(2).max(10),
  level: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  cards: cardsArraySchema,
  published: z.boolean().default(false),
  requiredPermissionKey: requiredPermissionKeySchema,
});

// id is immutable after creation, so it's excluded from the update shape.
export const updateLessonEngineLessonSchema = createLessonEngineLessonSchema
  .omit({ id: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Same envelope as create, but `id` is optional — this backs the
 * pre-save "Validate" dry-run endpoint, which never persists anything, so an
 * admin can check a draft before choosing/confirming its final id.
 */
export const validateLessonDraftSchema = createLessonEngineLessonSchema
  .omit({ id: true })
  .extend({ id: createLessonEngineLessonSchema.shape.id.optional() });

/**
 * Booleans arrive as query strings ("true"/"false"). Explicit
 * true/false/undefined mapping is used (rather than z.coerce.boolean(),
 * which treats any non-empty string — including "false" — as true), and
 * `undefined` is preserved as "no filter" rather than coerced to `false`,
 * matching listVocabularySchema's booleanQueryParam convention elsewhere in
 * this codebase but tri-state since this is an optional filter, not a flag.
 */
const optionalBooleanQueryParam = z
  .enum(["true", "false"])
  .optional()
  .transform((val) => (val === undefined ? undefined : val === "true"));

export const listLessonEngineLessonsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  language: z.string().trim().min(2).max(10).optional(),
  level: z.string().trim().min(1).max(20).optional(),
  published: optionalBooleanQueryParam,
});

export const listPublishedLessonsSchema = z.object({
  language: z.string().trim().min(2).max(10).optional(),
  level: z.string().trim().min(1).max(20).optional(),
});

// ---------------------------------------------------------------------------
// Course / Section hierarchy (LessonEngineCourse -> LessonEngineSection ->
// LessonEngineSectionLesson). Purely organizational — content-access gating
// lives on the lesson itself (requiredPermissionKey above), never here, so a
// course can freely mix free preview lessons with premium ones.
// ---------------------------------------------------------------------------

export const courseIdParamSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

/**
 * `id` is present when the admin is editing an existing section, absent for
 * a brand-new one. Note: the write path (lessonEngine.repository.ts
 * createCourse/updateCourse) always deletes-and-recreates sections wholesale
 * rather than diffing by id, so this field is currently accepted but not
 * actually consumed by persistence — kept for API/client-state parity and
 * potential future diffing, not because the backend needs it today.
 */
const courseSectionSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(200),
  displayOrder: z.number().int().default(0),
  // Ordered — index in the array is the display order within the section.
  lessonIds: z.array(z.string().trim().min(1)).default([]),
});

export const createLessonEngineCourseSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, underscore, hyphen only"),
  language: z.string().trim().min(2).max(10),
  level: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  published: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  sections: z.array(courseSectionSchema).default([]),
});

// id is immutable after creation. `sections`, if present in the body at
// all, REPLACES the entire section/lesson-link structure (see
// lessonEngine.repository.ts updateCourse); omitting the key entirely means
// "leave sections untouched" — see the service layer's `!== undefined` check.
export const updateLessonEngineCourseSchema = createLessonEngineCourseSchema
  .omit({ id: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listLessonEngineCoursesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  language: z.string().trim().min(2).max(10).optional(),
  level: z.string().trim().min(1).max(20).optional(),
  published: optionalBooleanQueryParam,
});

export const listPublishedCoursesSchema = z.object({
  language: z.string().trim().min(2).max(10).optional(),
  level: z.string().trim().min(1).max(20).optional(),
});

export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;
export type CreateLessonEngineLessonInput = z.infer<typeof createLessonEngineLessonSchema>;
export type UpdateLessonEngineLessonInput = z.infer<typeof updateLessonEngineLessonSchema>;
export type ValidateLessonDraftInput = z.infer<typeof validateLessonDraftSchema>;
export type ListLessonEngineLessonsQuery = z.infer<typeof listLessonEngineLessonsSchema>;
export type ListPublishedLessonsQuery = z.infer<typeof listPublishedLessonsSchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type CreateLessonEngineCourseInput = z.infer<typeof createLessonEngineCourseSchema>;
export type UpdateLessonEngineCourseInput = z.infer<typeof updateLessonEngineCourseSchema>;
export type ListLessonEngineCoursesQuery = z.infer<typeof listLessonEngineCoursesSchema>;
export type ListPublishedCoursesQuery = z.infer<typeof listPublishedCoursesSchema>;
