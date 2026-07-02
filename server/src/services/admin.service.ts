import { adminRepository } from "../repositories/admin.repository";
import { ApiError } from "../utils/ApiError";
import { addDays, startOfTodayUtc } from "../utils/dateUtils";
import {
  parseAndValidateCsv,
  revalidateImportRows,
  buildExampleCsv,
  buildExportCsv,
} from "./vocabularyImport.service";
import type { Prisma, VocabularyTranslation, VocabularyWord } from "@prisma/client";
import type {
  CommitVocabularyImportInput,
  CreateLanguageInput,
  CreateVocabularyWordInput,
  ListUsersQuery,
  UpdateLanguageInput,
  UpdateUserInput,
  UpdateVocabularyWordInput,
} from "../validators/admin.validators";

type VocabularyWordWithTranslations = VocabularyWord & { translations: VocabularyTranslation[] };

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
    // any native-language translations parsed from the CSV columns.
    const created = await adminRepository.createVocabularyWordsBulk(
      validRows.map((r) => ({
        french: r.data.french,
        pronunciationIpa: r.data.pronunciation,
        level: input.level,
        unitTitle: input.unitTitle,
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
};
