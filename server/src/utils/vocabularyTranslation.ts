import type { VocabularyTranslation } from "@prisma/client";

export interface ResolvedVocabularyTranslation {
  /** English translation text — always present (backfilled for every catalog word). */
  english: string;
  /**
   * The requesting user's native-language translation, or null when either
   * (a) the user's primary language IS English (no third translation
   * needed, per spec), or (b) no translation row exists yet for that
   * language on this word. Never throws for a missing translation.
   */
  nativeTranslation: { languageCode: string; text: string } | null;
}

/**
 * Shared learner-facing translation resolution logic, used by both
 * vocabulary.service.ts and lesson.service.ts so the "compute english +
 * nativeTranslation from a word's translations + the user's
 * primaryLanguageCode" rule lives in exactly one place.
 */
export function resolveVocabularyTranslation(
  translations: Pick<VocabularyTranslation, "languageCode" | "translatedText">[],
  primaryLanguageCode: string
): ResolvedVocabularyTranslation {
  const english = translations.find((t) => t.languageCode === "en")?.translatedText ?? "";

  if (primaryLanguageCode === "en") {
    return { english, nativeTranslation: null };
  }

  const native = translations.find((t) => t.languageCode === primaryLanguageCode);
  return {
    english,
    nativeTranslation: native ? { languageCode: primaryLanguageCode, text: native.translatedText } : null,
  };
}
