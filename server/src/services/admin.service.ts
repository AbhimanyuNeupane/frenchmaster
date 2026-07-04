import { adminRepository } from "../repositories/admin.repository";
import { ApiError } from "../utils/ApiError";
import { addDays, startOfTodayUtc } from "../utils/dateUtils";
import { mapWithConcurrency } from "../utils/concurrency";
import {
  parseAndValidateCsv,
  revalidateImportRows,
  buildExampleCsv,
  buildExportCsv,
} from "./vocabularyImport.service";
import { translationAiService, type TranslationSuggestion } from "./translationAi.service";
import { DEFAULT_VOCABULARY_CATEGORY_ICON } from "../constants/vocabularyCategoryIcons";
import type { Prisma, VocabularyTranslation, VocabularyWord } from "@prisma/client";
import type {
  AiTranslateBulkInput,
  AiTranslateSingleInput,
  CommitVocabularyImportInput,
  CreateLanguageInput,
  CreateVocabularyWordInput,
  ListUsersQuery,
  UpdateLanguageInput,
  UpdateUserInput,
  UpdateVocabularyCategoryInput,
  UpdateVocabularyWordInput,
} from "../validators/admin.validators";

type VocabularyWordWithTranslations = VocabularyWord & { translations: VocabularyTranslation[] };

// AI bulk-translate job tuning: how many words to scan per DB page while
// looking for `limit` qualifying words, how many pages to scan before
// giving up (bounds worst-case work if almost nothing qualifies), and how
// many words to translate concurrently against the Anthropic API.
const TRANSLATION_SCAN_PAGE_SIZE = 50;
const TRANSLATION_SCAN_MAX_PAGES = 20;
const TRANSLATION_CONCURRENCY = 4;

/**
 * Admin-facing vocabulary word shape: ALL languages the word has been
 * translated into (unlike the learner-facing vocabulary.service.ts, which
 * only surfaces French/English/the user's own primary language) — the
 * admin UI needs to see/edit every language at once. Renames
 * `translatedText` -> `text` on the API surface.
 */
function toAdminVocabularyWord(word: VocabularyWordWithTranslations) {
  const { translations, ...rest } = word;
  return {
    ...rest,
    translations: translations.map((t) => ({ languageCode: t.languageCode, text: t.translatedText })),
  };
}

/** Throws ApiError.badRequest listing any languageCode not present in the Language table. */
async function assertLanguageCodesExist(codes: string[]): Promise<void> {
  const { missing } = await adminRepository.languageCodesExist(codes);
  if (missing.length > 0) {
    throw ApiError.badRequest(`Unknown language code: ${missing.join(", ")}`);
  }
}

export const adminService = {
  /**
   * Admin user list — search matches email or name (case-insensitive),
   * optional role/status filters, offset-paginated.
   */
  async listUsers(query: ListUsersQuery) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: "insensitive" as const } },
              { name: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [users, total] = await Promise.all([
      adminRepository.findUsers(where, skip, query.pageSize),
      adminRepository.countUsers(where),
    ]);

    return {
      users,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  /**
   * Updates a user's role/status/level. An admin may not change their own
   * role or status — prevents a slip of the finger (or a bug) locking the
   * only admin out of the admin panel. currentLevel has no such risk.
   */
  async updateUser(actingAdminId: string, targetUserId: string, input: UpdateUserInput) {
    if (
      targetUserId === actingAdminId &&
      (input.role !== undefined || input.status !== undefined)
    ) {
      throw ApiError.forbidden("Admins cannot change their own role or status");
    }

    const existing = await adminRepository.findUserById(targetUserId);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("User not found");
    }

    return adminRepository.updateUser(targetUserId, input);
  },

  /**
   * Dashboard-style overview for the admin analytics landing page. Cheap
   * enough to compute live at current scale; revisit with materialized
   * daily snapshots if the users table grows large.
   */
  async getAnalyticsOverview() {
    const today = startOfTodayUtc();
    const sevenDaysAgo = addDays(today, -7);
    const thirtyDaysAgo = addDays(today, -30);

    const [totalUsers, newUsersLast7Days, newUsersLast30Days, activeLast7DaysRows, vocabularyWordCount] =
      await Promise.all([
        adminRepository.countAllUsers(),
        adminRepository.countUsersCreatedSince(sevenDaysAgo),
        adminRepository.countUsersCreatedSince(thirtyDaysAgo),
        adminRepository.countDistinctActiveUsersSince(sevenDaysAgo),
        adminRepository.countVocabularyWords(),
      ]);

    return {
      totalUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      activeUsersLast7Days: activeLast7DaysRows.length,
      vocabularyWordCount,
    };
  },

  // --- Vocabulary content authoring ---

  async listVocabularyWords(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [words, total] = await Promise.all([
      adminRepository.findVocabularyWordsForAdmin(skip, pageSize),
      adminRepository.countVocabularyWords(),
    ]);
    return {
      words: words.map(toAdminVocabularyWord),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  async createVocabularyWord(input: CreateVocabularyWordInput) {
    await assertLanguageCodesExist(input.translations.map((t) => t.languageCode));
    const word = await adminRepository.createVocabularyWord(input);
    return toAdminVocabularyWord(word);
  },

  async updateVocabularyWord(id: string, input: UpdateVocabularyWordInput) {
    const existing = await adminRepository.findVocabularyWordById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Vocabulary word not found");
    }
    if (input.translations) {
      await assertLanguageCodesExist(input.translations.map((t) => t.languageCode));
    }
    const word = await adminRepository.updateVocabularyWord(id, input);
    return toAdminVocabularyWord(word);
  },

  async deleteVocabularyWord(id: string) {
    const existing = await adminRepository.findVocabularyWordById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Vocabulary word not found");
    }
    await adminRepository.softDeleteVocabularyWord(id);
  },

  // --- Vocabulary CSV import/export ---

  previewVocabularyImport(fileBuffer: Buffer) {
    return parseAndValidateCsv(fileBuffer);
  },

  /**
   * Commits a previously-previewed batch. Re-validates every row itself
   * (never trusts client-reported errors) and only imports rows with zero
   * errors; everything else is reported back as skipped.
   */
  async commitVocabularyImport(input: CommitVocabularyImportInput) {
    const revalidated = await revalidateImportRows(input.rows);

    const validRows = revalidated.filter((r) => r.errors.length === 0);
    const invalidRows = revalidated.filter((r) => r.errors.length > 0);

    if (validRows.length === 0) {
      return {
        imported: 0,
        skipped: invalidRows.length,
        errors: invalidRows.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors })),
      };
    }

    // English translation is always present (validated above) alongside
    // any native-language translations parsed from the CSV columns. Each
    // row's own Category (if the CSV had one) wins over the batch-level
    // unitTitle — a mixed-topic file is no longer forced into one category.
    const created = await adminRepository.createVocabularyWordsBulk(
      validRows.map((r) => ({
        french: r.data.french,
        pronunciationIpa: r.data.pronunciation,
        level: input.level,
        unitTitle: r.data.category || input.unitTitle,
        translations: [{ languageCode: "en", text: r.data.english }, ...r.data.translations],
      }))
    );

    return {
      imported: created.length,
      skipped: invalidRows.length,
      errors: invalidRows.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors })),
    };
  },

  buildExampleCsv,
  buildExportCsv,

  // --- Language management ---

  listLanguages() {
    return adminRepository.findAllLanguages();
  },

  async createLanguage(input: CreateLanguageInput) {
    const existing = await adminRepository.findLanguageByCode(input.code);
    if (existing) {
      throw ApiError.conflict(`Language code "${input.code}" already exists`);
    }
    return adminRepository.createLanguage(input);
  },

  /**
   * The default language (English) may never be disabled — it's the
   * fallback every user without an explicit preference resolves to, and
   * the one language guaranteed to have translations for every word.
   * There is intentionally no route to change WHICH language is default in
   * this pass (isDefault is excluded from the update schema entirely).
   */
  async updateLanguage(code: string, input: UpdateLanguageInput) {
    const existing = await adminRepository.findLanguageByCode(code);
    if (!existing) {
      throw ApiError.notFound("Language not found");
    }
    if (existing.isDefault && input.enabled === false) {
      throw ApiError.forbidden("The default language cannot be disabled");
    }
    return adminRepository.updateLanguage(code, input);
  },

  // --- AI-assisted vocabulary translation ---

  aiTranslateStatus() {
    return { configured: translationAiService.isConfigured() };
  },

  /**
   * Preview-only: returns AI-suggested translations for admin review, never
   * writes to the DB (the admin's normal Save flow, unchanged, is what
   * persists). Target languages are the requested `languageCodes` as-is
   * (explicit request = "translate/regenerate exactly these", regardless of
   * whether a translation already exists), or — if omitted — every enabled
   * language this word doesn't already have a translation for.
   */
  async suggestVocabularyTranslations(
    id: string,
    input: AiTranslateSingleInput
  ): Promise<TranslationSuggestion[]> {
    const word = await adminRepository.findVocabularyWordById(id);
    if (!word || word.deletedAt) {
      throw ApiError.notFound("Vocabulary word not found");
    }

    let targetCodes: string[];
    if (input.languageCodes && input.languageCodes.length > 0) {
      await assertLanguageCodesExist(input.languageCodes);
      targetCodes = Array.from(new Set(input.languageCodes));
    } else {
      const existingCodes = new Set(word.translations.map((t) => t.languageCode));
      const enabled = await adminRepository.findEnabledLanguages();
      targetCodes = enabled.map((l) => l.code).filter((code) => !existingCodes.has(code));
    }

    if (targetCodes.length === 0) {
      return [];
    }

    const allLanguages = await adminRepository.findAllLanguages();
    const nameByCode = new Map(allLanguages.map((l) => [l.code, l.name]));
    const targetLanguages = targetCodes.map((code) => ({ code, name: nameByCode.get(code) ?? code }));

    return translationAiService.translateWord({
      french: word.french,
      partOfSpeech: word.partOfSpeech,
      exampleFr: word.exampleFr,
      level: word.level,
      targetLanguages,
    });
  },

  /**
   * Scans up to `limit` non-deleted vocabulary words missing at least one
   * target-language translation, and WRITES only the missing languageCode
   * entries per word — existing translations are never touched (see
   * adminRepository.addMissingVocabularyTranslations). A per-word AI/parse
   * failure is caught and recorded in `errors`, never aborts the batch.
   * Concurrency is capped (TRANSLATION_CONCURRENCY) to avoid hammering the
   * Anthropic API with dozens of parallel requests.
   */
  async bulkFillVocabularyTranslations(input: AiTranslateBulkInput) {
    if (!translationAiService.isConfigured()) {
      throw ApiError.notImplemented("AI translation is not configured yet", {
        reason: "Missing ANTHROPIC_API_KEY",
      });
    }

    let targetLanguages: { code: string; name: string }[];
    if (input.languageCodes && input.languageCodes.length > 0) {
      await assertLanguageCodesExist(input.languageCodes);
      const allLanguages = await adminRepository.findAllLanguages();
      const nameByCode = new Map(allLanguages.map((l) => [l.code, l.name]));
      const uniqueCodes = Array.from(new Set(input.languageCodes));
      targetLanguages = uniqueCodes.map((code) => ({ code, name: nameByCode.get(code) ?? code }));
    } else {
      const enabled = await adminRepository.findEnabledLanguages();
      targetLanguages = enabled.map((l) => ({ code: l.code, name: l.name }));
    }

    if (targetLanguages.length === 0) {
      return { wordsProcessed: 0, translationsAdded: 0, errors: [] as { wordId: string; error: string }[] };
    }
    const targetCodes = new Set(targetLanguages.map((l) => l.code));

    // Page through the catalog looking for words missing at least one
    // target language, bounded by TRANSLATION_SCAN_MAX_PAGES so an
    // unlucky catalog (almost everything already translated) doesn't
    // trigger a full-table scan.
    const candidates: VocabularyWordWithTranslations[] = [];
    for (let page = 0; page < TRANSLATION_SCAN_MAX_PAGES && candidates.length < input.limit; page++) {
      const batch = await adminRepository.findVocabularyWordsForTranslationScan(
        page * TRANSLATION_SCAN_PAGE_SIZE,
        TRANSLATION_SCAN_PAGE_SIZE
      );
      if (batch.length === 0) break;

      for (const word of batch) {
        const existingCodes = new Set(word.translations.map((t) => t.languageCode));
        const isMissingSomething = targetLanguages.some((l) => !existingCodes.has(l.code));
        if (isMissingSomething) {
          candidates.push(word);
          if (candidates.length >= input.limit) break;
        }
      }

      if (batch.length < TRANSLATION_SCAN_PAGE_SIZE) break; // reached end of table
    }

    const errors: { wordId: string; error: string }[] = [];
    let translationsAdded = 0;

    await mapWithConcurrency(candidates, TRANSLATION_CONCURRENCY, async (word) => {
      try {
        const existingCodes = new Set(word.translations.map((t) => t.languageCode));
        const missingLanguages = targetLanguages.filter((l) => !existingCodes.has(l.code));
        if (missingLanguages.length === 0) return;

        const suggestions = await translationAiService.translateWord({
          french: word.french,
          partOfSpeech: word.partOfSpeech,
          exampleFr: word.exampleFr,
          level: word.level,
          targetLanguages: missingLanguages,
        });

        // Extra safety: only ever write languageCodes we actually asked
        // for and that are still missing — ignore anything else, never
        // touch a code that already has a translation row.
        const missingCodeSet = new Set(missingLanguages.map((l) => l.code));
        const toWrite = suggestions.filter(
          (s) => missingCodeSet.has(s.languageCode) && targetCodes.has(s.languageCode)
        );

        if (toWrite.length > 0) {
          const result = await adminRepository.addMissingVocabularyTranslations(word.id, toWrite);
          translationsAdded += result.count;
        }
      } catch (err) {
        errors.push({ wordId: word.id, error: err instanceof Error ? err.message : "Unknown error" });
      }
    });

    return { wordsProcessed: candidates.length, translationsAdded, errors };
  },

  // --- Vocabulary category presentation ---

  /** Every category in use, merged with its admin-set icon/order (defaults for anything not yet customized). Same merge logic as the learner-facing vocabularyService.getCategories() — this is the admin's editable view over the same data. */
  async listVocabularyCategories() {
    const [counts, metaRows] = await Promise.all([
      adminRepository.findCategoryWordCounts(),
      adminRepository.findAllCategoryMeta(),
    ]);
    const metaByName = new Map(metaRows.map((m) => [m.name, m]));

    return counts
      .map(({ name, count }) => {
        const meta = metaByName.get(name);
        return {
          name,
          icon: meta?.icon ?? DEFAULT_VOCABULARY_CATEGORY_ICON,
          displayOrder: meta?.displayOrder ?? 0,
          wordCount: count,
          managed: meta !== undefined,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  },

  /**
   * Returns the same merged {name, icon, displayOrder, wordCount, managed}
   * shape as listVocabularyCategories() — NOT the raw VocabularyCategoryMeta
   * row (which has no wordCount at all, since that's computed from the
   * catalog, not stored). Returning the raw row here was a real bug: the
   * admin UI's optimistic-then-replace-with-server-response pattern wiped
   * out the word count the moment an admin changed an icon/order.
   */
  async updateVocabularyCategory(name: string, input: UpdateVocabularyCategoryInput) {
    const exists = await adminRepository.categoryExists(name);
    if (!exists) {
      throw ApiError.notFound(`Category "${name}" has no words — nothing to customize`);
    }
    await adminRepository.upsertCategoryMeta(name, input);
    const all = await this.listVocabularyCategories();
    const updated = all.find((c) => c.name === name);
    if (!updated) {
      // Shouldn't happen (we just confirmed the category exists), but never
      // return undefined from an endpoint that promises a category object.
      throw ApiError.internal("Category was updated but could not be re-read");
    }
    return updated;
  },
};
