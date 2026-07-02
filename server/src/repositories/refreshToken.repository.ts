import { prisma } from "../config/prisma";

export const refreshTokenRepository = {
  create(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdByIp?: string | null;
  }) {
    return prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
        createdByIp: params.createdByIp ?? null,
      },
    });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revoke(id: string, replacedByTokenId?: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedByTokenId: replacedByTokenId ?? null },
    });
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
