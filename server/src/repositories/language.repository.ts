import { prisma } from "../config/prisma";

/**
 * Public read surface over the Language catalog — backs GET /api/languages
 * (no auth: the signup form needs this before an account exists) as well
 * as anywhere else enabled languages need to be listed to end users.
 * Admin CRUD over this table lives in admin.repository.ts instead.
 */
export const languageRepository = {
  findEnabledLanguages() {
    return prisma.language.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
    });
  },
};
