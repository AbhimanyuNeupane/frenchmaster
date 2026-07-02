import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

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

  countVocabularyWords() {
    return prisma.vocabularyWord.count({ where: { deletedAt: null } });
  },

  // --- Vocabulary content authoring ---

  findVocabularyWordsForAdmin(skip: number, take: number) {
    return prisma.vocabularyWord.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  findVocabularyWordById(id: string) {
    return prisma.vocabularyWord.findUnique({ where: { id } });
  },

  createVocabularyWord(data: Prisma.VocabularyWordCreateInput) {
    return prisma.vocabularyWord.create({ data });
  },

  updateVocabularyWord(id: string, data: Prisma.VocabularyWordUpdateInput) {
    return prisma.vocabularyWord.update({ where: { id }, data });
  },

  /** Soft delete — preserves history for any UserVocabularyProgress rows pointing at it. */
  softDeleteVocabularyWord(id: string) {
    return prisma.vocabularyWord.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
