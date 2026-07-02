import { z } from "zod";
import { idSchema } from "./common";

/**
 * Query params for GET /api/vocabulary. All optional per
 * docs/BACKEND_API_CONTRACT_VOCABULARY.md. Booleans arrive as query strings
 * ("true"/"false"), so they're coerced explicitly rather than via
 * z.coerce.boolean() (which treats any non-empty string, including
 * "false", as true).
 */
const booleanQueryParam = z
  .enum(["true", "false"])
  .optional()
  .transform((val) => val === "true");

export const listVocabularySchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2"]).optional(),
  favoritesOnly: booleanQueryParam,
  dueOnly: booleanQueryParam,
  search: z.string().trim().min(1).max(200).optional(),
});

export const vocabularyIdParamSchema = z.object({
  id: idSchema,
});

export type ListVocabularyQuery = z.infer<typeof listVocabularySchema>;
export type VocabularyIdParam = z.infer<typeof vocabularyIdParamSchema>;
