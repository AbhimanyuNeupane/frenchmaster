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
 * A single (languageCode, text) translation entry as authored by the admin.
 * languageCode must reference an existing Language row (enabled or not —
 * an admin may pre-author content for a language before enabling it) —
 * enforced in admin.service.ts via adminRepository.languageCodesExist,
 * not here, since Zod has no DB access.
 */
const translationEntrySchema = z.object({
  languageCode: z.string().trim().toLowerCase().min(2).max(10),
  text: z.string().trim().min(1).max(500),
});

const translationsArraySchema = z
  .array(translationEntrySchema)
  .min(1, "At least one translation is required")
  .refine((entries) => entries.some((e) => e.languageCode === "en"), {
    message: "An English translation is required",
  })
  .refine(
    (entries) => new Set(entries.map((e) => e.languageCode)).size === entries.length,
    { message: "Duplicate languageCode in translations" }
  );

/**
 * Vocabulary content-management schemas — reuses the shape of
 * VocabularyWord from vocabulary.validators.ts, but for admin authoring
 * (full CRUD) rather than read/favorite/review. `english` is intentionally
 * NOT a flat field here — see `translations` (must include one entry with
 * languageCode "en") which maps onto VocabularyTranslation rows, matching
 * the "no english/nepali/hindi columns" requirement.
 */
export const createVocabularyWordSchema = z.object({
  french: z.string().trim().min(1).max(200),
  translations: translationsArraySchema,
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

/**
 * Language management schemas. `code` and `isDefault` are deliberately
 * absent from the update schema — immutable after creation (see
 * admin.service.ts updateLanguage for the "default language can never be
 * disabled" guard rail).
 */
export const languageCodeParamSchema = z.object({
  code: z.string().trim().min(2).max(10),
});

export const createLanguageSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(10)
    .regex(/^[a-z-]+$/, "Language code must be lowercase letters/hyphens only"),
  name: z.string().trim().min(1).max(100),
  flagEmoji: z.string().trim().min(1).max(10),
  displayOrder: z.number().int().default(0),
  enabled: z.boolean().default(true),
});

export const updateLanguageSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    flagEmoji: z.string().trim().min(1).max(10).optional(),
    displayOrder: z.number().int().optional(),
    enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * CSV bulk-import commit body — the preview endpoint (multipart upload) has
 * no body schema of its own (multer + manual buffer parsing), but the
 * commit endpoint takes plain JSON: the previously-previewed rows plus the
 * batch-level level/unitTitle the admin picked once for the whole import
 * (the CSV format itself only carries French/English/native
 * translations/pronunciation per column, not level/unit).
 */
const importTranslationEntrySchema = z.object({
  languageCode: z.string().trim().toLowerCase().min(2).max(10),
  text: z.string().trim().min(1).max(500),
});

const importRowSchema = z.object({
  french: z.string().trim().max(200).default(""),
  english: z.string().trim().max(200).default(""),
  pronunciation: z.string().trim().max(200).default(""),
  // Per-row category override (from an optional "Category"/"Unit" CSV
  // column) — empty means "use the batch-level unitTitle below". A single
  // file mixing topics should never be forced into one category.
  category: z.string().trim().max(200).default(""),
  translations: z.array(importTranslationEntrySchema).default([]),
});

export const commitVocabularyImportSchema = z.object({
  rows: z.array(importRowSchema).min(1, "At least one row is required"),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  // Fallback category applied to any row with no per-row Category value.
  unitTitle: z.string().trim().min(1).max(200),
});

/**
 * AI-assisted translation schemas (translationAi.service.ts). The single
 * endpoint is a preview only (never writes to the DB) so `languageCodes`
 * just narrows which languages to suggest; the bulk endpoint additionally
 * takes `limit` since it scans the catalog and writes directly.
 */
export const aiTranslateSingleSchema = z.object({
  languageCodes: z.array(z.string().trim().min(2).max(10)).optional(),
});

export const aiTranslateBulkSchema = z.object({
  languageCodes: z.array(z.string().trim().min(2).max(10)).optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateVocabularyWordInput = z.infer<typeof createVocabularyWordSchema>;
export type UpdateVocabularyWordInput = z.infer<typeof updateVocabularyWordSchema>;
export type VocabularyWordIdParam = z.infer<typeof vocabularyWordIdParamSchema>;
export type LanguageCodeParam = z.infer<typeof languageCodeParamSchema>;
export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
export type CommitVocabularyImportInput = z.infer<typeof commitVocabularyImportSchema>;
export type AiTranslateSingleInput = z.infer<typeof aiTranslateSingleSchema>;
export type AiTranslateBulkInput = z.infer<typeof aiTranslateBulkSchema>;
