import { prisma } from "../config/prisma";
import type { CEFRLevel, MasteryStatus } from "@prisma/client";

/**
 * All raw queries backing the vocabulary feature. Kept separate from
 * VocabularyService so query shape/indexing can be reasoned about
 * independently of business logic (same convention as dashboard.repository).
 */
export const vocabularyRepository = {
  /**
   * Full catalog, optionally filtered by level/search. Filtering happens
   * here (not fully client-side) because the service still needs the FULL
   * unfiltered set for stats — see findAllWordsWithProgress below, which is
   * the one that actually powers stats computation.
   */
  findWords(filter: { level?: CEFRLevel; search?: string }) {
    return prisma.vocabularyWord.findMany({
      where: {
        deletedAt: null,
        ...(filter.level ? { level: filter.level } : {}),
        ...(filter.search
          ? {
              OR: [
                { french: { contains: filter.search, mode: "insensitive" as const } },
                { english: { contains: filter.search, mode: "insensitive" as const } },
                { unitTitle: { contains: filter.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ level: "asc" }, { unitTitle: "asc" }, { french: "asc" }],
    });
  },

  /** Every catalog word's id — used to compute full-set stats cheaply. */
  findAllWordIds() {
    return prisma.vocabularyWord.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
  },

  /** All of a user's progress rows, for joining in-memory against the catalog. */
  findAllProgressForUser(userId: string) {
    return prisma.userVocabularyProgress.findMany({ where: { userId } });
  },

  findWordById(id: string) {
    return prisma.vocabularyWord.findFirst({ where: { id, deletedAt: null } });
  },

  findProgress(userId: string, wordId: string) {
    return prisma.userVocabularyProgress.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });
  },

  /**
   * Creates the progress row on first interaction, otherwise updates it.
   * Used by both favorite-toggle and review so callers never have to branch
   * on "does a row exist yet."
   */
  upsertProgress(
    userId: string,
    wordId: string,
    data: { isFavorite?: boolean; masteryStatus?: MasteryStatus; lastReviewedAt?: Date }
  ) {
    return prisma.userVocabularyProgress.upsert({
      where: { userId_wordId: { userId, wordId } },
      update: data,
      create: {
        userId,
        wordId,
        isFavorite: data.isFavorite ?? false,
        masteryStatus: data.masteryStatus ?? "new",
        lastReviewedAt: data.lastReviewedAt ?? null,
      },
    });
  },
};
