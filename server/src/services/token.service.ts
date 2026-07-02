import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env";
import type { AccessTokenPayload } from "../types/jwt";

/**
 * All JWT signing/verification and refresh-token hashing lives here so the
 * rest of the app never touches `jsonwebtoken` or raw secrets directly.
 */

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings (not JWTs) so revocation is a
 * simple DB row lookup/delete rather than requiring a denylist for
 * otherwise-stateless JWTs. Only the SHA-256 hash is persisted.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiryDate(): Date {
  const days = env.JWT_REFRESH_EXPIRES_IN_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
