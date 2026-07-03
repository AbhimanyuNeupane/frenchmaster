import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../services/token.service";
import { userRepository } from "../repositories/user.repository";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success,
 * attaches the decoded payload to `req.user` for downstream handlers.
 *
 * Also enforces LIVE account status on every request (not just signature
 * validity): a SUSPENDED/BANNED user's still-valid access token (<=15m TTL)
 * must stop working the moment an admin acts, not once the token expires.
 * This means one extra indexed primary-key lookup per authenticated
 * request — acceptable at current scale; if this becomes a hot path, cache
 * the (userId -> status) lookup in Redis with a short TTL and invalidate it
 * from the admin PATCH endpoint.
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

    req.user = payload;
    next();
  }
);

/**
 * Same Bearer-token verification as `requireAuth`, but never throws — on
 * any failure (no header, malformed header, invalid/expired token, user not
 * found/deleted, account not ACTIVE) it just calls `next()` with `req.user`
 * left `undefined`. Used on public routes that need to know the requester's
 * role WHEN present (e.g. lesson-engine content gating, see
 * lessonEngine.service.ts / utils/roleRank.ts) without requiring a token —
 * an anonymous request must stay genuinely accessible.
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
        req.user = payload;
      }
    } catch {
      // Invalid/expired token on a public route — stay anonymous, don't fail the request.
    }

    next();
  }
);

/**
 * Role-based access guard. Use after `requireAuth`. Not used by the
 * dashboard endpoint today, but wired up for future admin-only routes.
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!allowed.includes(req.user.role)) {
      throw ApiError.forbidden("Insufficient permissions");
    }
    next();
  };
}
