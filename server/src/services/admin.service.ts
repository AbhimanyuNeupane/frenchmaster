import { adminRepository } from "../repositories/admin.repository";
import { ApiError } from "../utils/ApiError";
import { addDays, startOfTodayUtc } from "../utils/dateUtils";
import type { Prisma } from "@prisma/client";
import type {
  CreateVocabularyWordInput,
  ListUsersQuery,
  UpdateUserInput,
  UpdateVocabularyWordInput,
} from "../validators/admin.validators";

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
      words,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  createVocabularyWord(input: CreateVocabularyWordInput) {
    return adminRepository.createVocabularyWord(input);
  },

  async updateVocabularyWord(id: string, input: UpdateVocabularyWordInput) {
    const existing = await adminRepository.findVocabularyWordById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Vocabulary word not found");
    }
    return adminRepository.updateVocabularyWord(id, input);
  },

  async deleteVocabularyWord(id: string) {
    const existing = await adminRepository.findVocabularyWordById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Vocabulary word not found");
    }
    await adminRepository.softDeleteVocabularyWord(id);
  },
};
