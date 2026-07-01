import { prisma } from "@/config/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Thin data-access layer over the `User` table. Controllers/services never
 * call `prisma.user.*` directly — everything goes through here so query
 * shape/indexing decisions live in one place.
 */
export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
};
