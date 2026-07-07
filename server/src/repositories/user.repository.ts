import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

/** Always joined in — every caller needs the user's live permission set (see utils/permissions.ts), and it's a single cheap join. */
const roleWithPermissions = {
  role: { include: { permissions: { include: { permission: true } } } },
} satisfies Prisma.UserInclude;

/**
 * Thin data-access layer over the `User` table. Controllers/services never
 * call `prisma.user.*` directly — everything goes through here so query
 * shape/indexing decisions live in one place.
 */
export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: roleWithPermissions });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: roleWithPermissions });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: roleWithPermissions });
  },
};
