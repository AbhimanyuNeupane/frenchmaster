import bcrypt from "bcryptjs";
import { userRepository } from "@/repositories/user.repository";
import { refreshTokenRepository } from "@/repositories/refreshToken.repository";
import { ApiError } from "@/utils/ApiError";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
  signAccessToken,
  verifyAccessToken,
} from "@/services/token.service";
import { logger } from "@/config/logger";
import type { RegisterInput, LoginInput } from "@/validators/auth.validators";
import type { User } from "@prisma/client";

const BCRYPT_ROUNDS = 12;

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    currentLevel: user.currentLevel,
  };
}

async function issueTokenPair(user: User, ip?: string | null) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

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

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
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

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

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
};

// Re-exported so route stubs can validate a token shape without importing
// the middleware layer directly (kept for symmetry/future use).
export { verifyAccessToken };
