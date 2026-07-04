import { prisma } from "../config/prisma";
import type { CEFRLevel, Prisma, WordGender, PartOfSpeech } from "@prisma/client";

/** A single (languageCode, text) translation entry, admin-authoring shape. */
export interface TranslationEntryInput {
  languageCode: string;
  text: string;
}

/** VocabularyWord scalar fields an admin can author, minus id/timestamps/translations. */
type VocabularyWordScalarInput = {
  french: string;
  gender?: WordGender | null;
  partOfSpeech: PartOfSpeech;
  pronunciationIpa: string;
  audioUrl?: string | null;
  exampleFr: string;
  exampleEn: string;
  imageUrl?: string | null;
  synonyms?: string[];
  commonMistake?: string | null;
  level: CEFRLevel;
  unitTitle: string;
};

/**
 * Raw queries backing the admin user-management and analytics endpoints.
 * Same convention as dashboard.repository.ts / vocabulary.repository.ts:
 * query shape/indexing lives here, business logic (pagination math, guard
 * rails) lives in admin.service.ts.
 */
export const adminRepository = {
  /** Admin-facing user list projection — never selects passwordHash. */
  findUsers(where: Prisma.UserWhereInput, skip: number, take: number) {
    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        currentLevel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  countUsers(where: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        currentLevel: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  // --- Analytics overview ---

  countAllUsers() {
    return prisma.user.count({ where: { deletedAt: null } });
  },

  countUsersCreatedSince(since: Date) {
    return prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since } } });
  },

  /** Distinct users with a DailyActivity row on/after `since`. */
  countDistinctActiveUsersSince(since: Date) {
    return prisma.dailyActivity.findMany({
      where: { date: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    });
  },

  countVocabularyWords(unitTitle?: string) {
    return prisma.vocabularyWord.count({
      where: { deletedAt: null, ...(unitTitle ? { unitTitle } : {}) },
    });
  },

  // --- Vocabulary content authoring ---
  //
  // Admin CRUD sees/edits ALL languages a word has been translated into
  // (unlike the learner-facing vocabulary.service.ts, which only surfaces
  // French/English/the user's own primary language) — always `include:
  // { translations: true }` here.

  /** `unitTitle` scopes the list to one category — the admin browsing UI fetches one category's full word list at a time rather than paginating the whole catalog. */
  findVocabularyWordsForAdmin(skip: number, take: number, unitTitle?: string) {
    return prisma.vocabularyWord.findMany({
      where: { deletedAt: null, ...(unitTitle ? { unitTitle } : {}) },
      include: { translations: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  findVocabularyWordById(id: string) {
    return prisma.vocabularyWord.findUnique({
      where: { id },
      include: { translations: true },
    });
  },

  /**
   * Case-insensitive lookup of existing (non-deleted) catalog words by
   * their French text — used by CSV import to flag "duplicate vocabulary:
   * already exists" without an N+1 query per row.
   */
  findVocabularyWordsByFrenchTexts(frenchTexts: string[]) {
    if (frenchTexts.length === 0) return Promise.resolve([]);
    return prisma.vocabularyWord.findMany({
      where: { deletedAt: null, french: { in: frenchTexts, mode: "insensitive" } },
      select: { id: true, french: true },
    });
  },

  createVocabularyWord(input: VocabularyWordScalarInput & { translations: TranslationEntryInput[] }) {
    const { translations, ...rest } = input;
    return prisma.vocabularyWord.create({
      data: {
        ...rest,
        translations: {
          create: translations.map((t) => ({ languageCode: t.languageCode, translatedText: t.text })),
        },
      },
      include: { translations: true },
    });
  },

  /**
   * Translations can be added/edited/removed arbitrarily on update, so the
   * simplest correct approach — at this word-catalog scale — is
   * delete-all-then-recreate inside a transaction, rather than diffing.
   */
  updateVocabularyWord(
    id: string,
    input: Partial<VocabularyWordScalarInput> & { translations?: TranslationEntryInput[] }
  ) {
    const { translations, ...rest } = input;

    if (!translations) {
      return prisma.vocabularyWord.update({
        where: { id },
        data: rest,
        include: { translations: true },
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.vocabularyTranslation.deleteMany({ where: { vocabularyWordId: id } });
      return tx.vocabularyWord.update({
        where: { id },
        data: {
          ...rest,
          translations: {
            create: translations.map((t) => ({ languageCode: t.languageCode, translatedText: t.text })),
          },
        },
        include: { translations: true },
      });
    });
  },

  /** Soft delete — preserves history for any UserVocabularyProgress rows pointing at it. */
  softDeleteVocabularyWord(id: string) {
    return prisma.vocabularyWord.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  /**
   * Bulk-creates words from a validated CSV import batch, all-or-nothing
   * per row within a single transaction. Each row gets partOfSpeech:
   * "noun" and gender: null as defaults (not present in the CSV format —
   * the admin can refine specifics afterward via the normal edit dialog).
   */
  /**
   * `partOfSpeech`/`gender` default to "noun"/null when the CSV didn't
   * include those columns (or a row's cell was empty) — same behavior as
   * before these columns were recognized. When provided, the caller
   * (admin.service.ts) has already validated them against the real enum
   * values via vocabularyImport.service.ts, so they're trusted here.
   * `exampleFr`/`exampleEn`/`synonyms`/`commonMistake` default to empty,
   * same as before, when the CSV didn't provide them.
   */
  createVocabularyWordsBulk(
    rows: {
      french: string;
      pronunciationIpa: string;
      level: CEFRLevel;
      unitTitle: string;
      partOfSpeech?: PartOfSpeech;
      gender?: WordGender | null;
      synonyms?: string[];
      exampleFr?: string;
      exampleEn?: string;
      commonMistake?: string | null;
      translations: TranslationEntryInput[];
    }[]
  ) {
    return prisma.$transaction(
      rows.map((row) =>
        prisma.vocabularyWord.create({
          data: {
            french: row.french,
            gender: row.gender ?? null,
            partOfSpeech: row.partOfSpeech ?? "noun",
            pronunciationIpa: row.pronunciationIpa,
            exampleFr: row.exampleFr ?? "",
            exampleEn: row.exampleEn ?? "",
            synonyms: row.synonyms ?? [],
            commonMistake: row.commonMistake ?? null,
            level: row.level,
            unitTitle: row.unitTitle,
            translations: {
              create: row.translations.map((t) => ({ languageCode: t.languageCode, translatedText: t.text })),
            },
          },
        })
      )
    );
  },

  // --- AI-assisted translation (translationAi.service.ts / admin.service.ts) ---

  /**
   * Pages through non-deleted vocabulary words, oldest-updated first, so
   * repeated bulk-fill runs naturally rotate through the catalog instead of
   * always rescanning the same head of the table. `translations` included
   * so the caller can diff against target language codes without an
   * extra query per word. Used by the AI bulk-translate job to find words
   * missing at least one target-language translation (that filtering
   * happens in admin.service.ts, in JS, since "translation count for a
   * subset of codes < N" isn't a clean single Prisma where-filter).
   */
  findVocabularyWordsForTranslationScan(skip: number, take: number) {
    return prisma.vocabularyWord.findMany({
      where: { deletedAt: null },
      include: { translations: true },
      orderBy: { updatedAt: "asc" },
      skip,
      take,
    });
  },

  /**
   * Inserts translation rows ONLY for languageCodes not already present on
   * the word — this is the bulk-fill safety guarantee (never overwrite a
   * human-authored translation). `skipDuplicates` is a second line of
   * defense at the DB level (the (vocabularyWordId, languageCode) unique
   * constraint) in case of a race with a concurrent admin edit between the
   * caller's "missing" computation and this write.
   */
  addMissingVocabularyTranslations(vocabularyWordId: string, entries: TranslationEntryInput[]) {
    if (entries.length === 0) return Promise.resolve({ count: 0 });
    return prisma.vocabularyTranslation.createMany({
      data: entries.map((e) => ({ vocabularyWordId, languageCode: e.languageCode, translatedText: e.text })),
      skipDuplicates: true,
    });
  },

  // --- Language management ---
  //
  // Adding a new language is a pure data operation (this CRUD surface) —
  // no schema/code change required. See Language model note in schema.prisma.

  findAllLanguages() {
    return prisma.language.findMany({ orderBy: [{ displayOrder: "asc" }, { code: "asc" }] });
  },

  findEnabledLanguages() {
    return prisma.language.findMany({
      where: { enabled: true },
      orderBy: [{ displayOrder: "asc" }, { code: "asc" }],
    });
  },

  findLanguageByCode(code: string) {
    return prisma.language.findUnique({ where: { code } });
  },

  createLanguage(data: Prisma.LanguageCreateInput) {
    return prisma.language.create({ data });
  },

  updateLanguage(code: string, data: Prisma.LanguageUpdateInput) {
    return prisma.language.update({ where: { code }, data });
  },

  /** Diffs the given codes against the Language table; returns any that don't exist (any status). */
  async languageCodesExist(codes: string[]): Promise<{ missing: string[] }> {
    const unique = Array.from(new Set(codes));
    if (unique.length === 0) return { missing: [] };
    const rows = await prisma.language.findMany({
      where: { code: { in: unique } },
      select: { code: true },
    });
    const found = new Set(rows.map((r) => r.code));
    return { missing: unique.filter((c) => !found.has(c)) };
  },

  // --- Vocabulary category presentation (icon + display order) ---

  async findCategoryWordCounts(): Promise<{ name: string; count: number }[]> {
    const rows = await prisma.vocabularyWord.groupBy({
      by: ["unitTitle"],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((r) => ({ name: r.unitTitle, count: r._count._all }));
  },

  findAllCategoryMeta() {
    return prisma.vocabularyCategoryMeta.findMany();
  },

  /** True if `name` is an actual category in use (i.e. some non-deleted word has this unitTitle) — admin can only customize a real category, not an arbitrary string. */
  async categoryExists(name: string): Promise<boolean> {
    const count = await prisma.vocabularyWord.count({ where: { unitTitle: name, deletedAt: null } });
    return count > 0;
  },

  /** Creates or updates a category's presentation metadata — a category with no prior row gets one on its first customization. */
  upsertCategoryMeta(name: string, data: { icon?: string; displayOrder?: number }) {
    return prisma.vocabularyCategoryMeta.upsert({
      where: { name },
      create: { name, icon: data.icon, displayOrder: data.displayOrder },
      update: data,
    });
  },
};
