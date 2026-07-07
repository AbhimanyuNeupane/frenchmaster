import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
  signAccessToken,
  verifyAccessToken,
} from "./token.service";
import { logger } from "../config/logger";
import { permissionKeysOf } from "../utils/permissions";
import type { RegisterInput, LoginInput, UpdateProfileInput } from "../validators/auth.validators";
import type { Prisma } from "@prisma/client";

const BCRYPT_ROUNDS = 12;
const DEFAULT_LANGUAGE_CODE = "en";

type UserWithPermissions = Prisma.UserGetPayload<{
  include: { role: { include: { permissions: { include: { permission: true } } } } };
}>;

function toPublicUser(user: UserWithPermissions) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.roleId,
    permissions: permissionKeysOf(user),
    currentLevel: user.currentLevel,
    primaryLanguage: user.primaryLanguageCode,
  };
}

/** Verifies a language code exists AND is enabled — throws ApiError.badRequest otherwise. */
async function assertEnabledLanguage(code: string): Promise<void> {
  const language = await prisma.language.findUnique({ where: { code } });
  if (!language || !language.enabled) {
    throw ApiError.badRequest("Unsupported language");
  }
}

async function issueTokenPair(user: UserWithPermissions, ip?: string | null) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.roleId });

  const refreshToken = generateRefreshToken();
  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
    createdByIp: ip,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput, ip?: string | null) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const primaryLanguageCode = input.primaryLanguage ?? DEFAULT_LANGUAGE_CODE;
    if (input.primaryLanguage) {
      await assertEnabledLanguage(primaryLanguageCode);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
      primaryLanguage: { connect: { code: primaryLanguageCode } },
    });

    logger.info({ userId: user.id }, "User registered");

    const tokens = await issueTokenPair(user, ip);
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput, ip?: string | null) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      // Same error whether the account doesn't exist or has no password
      // (OAuth-only) — avoids leaking which emails are registered.
      throw ApiError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    logger.info({ userId: user.id }, "User logged in");

    const tokens = await issueTokenPair(user, ip);
    return { user: toPublicUser(user), ...tokens };
  },

  async refresh(refreshToken: string, ip?: string | null) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await userRepository.findById(stored.userId);
    if (!user) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    // Rotation: revoke the presented token and issue a brand new pair.
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const newRecord = await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: refreshTokenExpiryDate(),
      createdByIp: ip,
    });
    await refreshTokenRepository.revoke(stored.id, newRecord.id);

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.roleId });

    return { user: toPublicUser(user), accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await refreshTokenRepository.revoke(stored.id);
    }
    // Idempotent: logging out with an already-invalid token is not an error.
  },

  /**
   * Updates the requesting user's primary language preference (Settings
   * page). Read fresh on every request that needs it (vocabulary/lesson
   * services) rather than trusting the JWT, which is fixed at sign time.
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    await assertEnabledLanguage(input.primaryLanguage);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { primaryLanguageCode: input.primaryLanguage },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    return toPublicUser(user);
  },
};

// Re-exported so route stubs can validate a token shape without importing
// the middleware layer directly (kept for symmetry/future use).
export { verifyAccessToken };
