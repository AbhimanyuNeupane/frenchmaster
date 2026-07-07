import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../services/token.service";
import { userRepository } from "../repositories/user.repository";
import { permissionKeysOf } from "../utils/permissions";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success,
 * attaches the decoded payload PLUS a freshly-read permission set to
 * `req.user` for downstream handlers.
 *
 * Also enforces LIVE account status AND live permissions on every request
 * (not just signature validity): a SUSPENDED/BANNED user's still-valid
 * access token (<=15m TTL) must stop working the moment an admin acts, and
 * a role/permission change an admin makes must take effect immediately too
 * — never wait for the access token to expire or be refreshed. This means
 * one extra indexed primary-key lookup (with its role+permissions join) per
 * authenticated request — acceptable at current scale; if this becomes a
 * hot path, cache the (userId -> permissions) lookup in Redis with a short
 * TTL and invalidate it from the admin role-assignment endpoints.
 */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or malformed Authorization header");
    }

    const token = header.slice("Bearer ".length).trim();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired access token");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw ApiError.unauthorized("Account no longer exists");
    }
    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden(
        user.status === "BANNED"
          ? "This account has been banned"
          : "This account has been suspended",
        { status: user.status }
      );
    }

    req.user = { ...payload, permissions: permissionKeysOf(user) };
    next();
  }
);

/**
 * Same Bearer-token verification as `requireAuth`, but never throws — on
 * any failure (no header, malformed header, invalid/expired token, user not
 * found/deleted, account not ACTIVE) it just calls `next()` with `req.user`
 * left `undefined`. Used on public routes that need to know the requester's
 * permissions WHEN present (e.g. lesson-engine content gating, see
 * lessonEngine.service.ts / utils/permissions.ts) without requiring a
 * token — an anonymous request must stay genuinely accessible.
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = header.slice("Bearer ".length).trim();

    try {
      const payload = verifyAccessToken(token);
      const user = await userRepository.findById(payload.sub);
      if (user && !user.deletedAt && user.status === "ACTIVE") {
        req.user = { ...payload, permissions: permissionKeysOf(user) };
      }
    } catch {
      // Invalid/expired token on a public route — stay anonymous, don't fail the request.
    }

    next();
  }
);

/**
 * Permission-based access guard. Use after `requireAuth`. Grants access if
 * the requester's live permission set (see `requireAuth`) contains ANY of
 * the given keys — replaces the old flat-role `requireRole`.
 */
export function requirePermission(...anyOf: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const granted = new Set(req.user.permissions);
    if (!anyOf.some((key) => granted.has(key))) {
      throw ApiError.forbidden("Insufficient permissions");
    }
    next();
  };
}
