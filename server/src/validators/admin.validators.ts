import { z } from "zod";
import { idSchema } from "./common";

/**
 * Query params for GET /api/admin/users. Offset-based pagination (page +
 * pageSize) is used rather than cursor-based here because the admin console
 * needs "jump to page N" / total-count UX, not infinite scroll — see
 * docs conventions in vocabulary.validators.ts for the sibling pattern.
 */
export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  role: z.enum(["ADMIN", "MODERATOR", "PREMIUM", "USER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
});

export const userIdParamSchema = z.object({
  id: idSchema,
});

/**
 * All fields optional (PATCH semantics), but at least one must be present —
 * an empty body is almost certainly a client bug, not an intentional no-op.
 */
export const updateUserSchema = z
  .object({
    role: z.enum(["ADMIN", "MODERATOR", "PREMIUM", "USER"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
    currentLevel: z.enum(["A1", "A2", "B1", "B2"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one of role, status, currentLevel must be provided",
  });

/**
 * Vocabulary content-management schemas — reuses the shape of
 * VocabularyWord from vocabulary.validators.ts, but for admin authoring
 * (full CRUD) rather than read/favorite/review.
 */
export const createVocabularyWordSchema = z.object({
  french: z.string().trim().min(1).max(200),
  english: z.string().trim().min(1).max(200),
  gender: z.enum(["masculine", "feminine", "neutral"]).nullable().optional(),
  partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb", "phrase", "expression"]),
  pronunciationIpa: z.string().trim().min(1).max(200),
  audioUrl: z.string().trim().url().nullable().optional(),
  exampleFr: z.string().trim().min(1).max(500),
  exampleEn: z.string().trim().min(1).max(500),
  imageUrl: z.string().trim().url().nullable().optional(),
  synonyms: z.array(z.string().trim().min(1)).default([]),
  commonMistake: z.string().trim().max(500).nullable().optional(),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  unitTitle: z.string().trim().min(1).max(200),
});

export const updateVocabularyWordSchema = createVocabularyWordSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const vocabularyWordIdParamSchema = z.object({
  id: idSchema,
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateVocabularyWordInput = z.infer<typeof createVocabularyWordSchema>;
export type UpdateVocabularyWordInput = z.infer<typeof updateVocabularyWordSchema>;
export type VocabularyWordIdParam = z.infer<typeof vocabularyWordIdParamSchema>;
