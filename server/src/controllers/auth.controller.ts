import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/auth.validators";

export const authController = {
  register: asyncHandler(async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
    const result = await authService.register(req.body, req.ip);
    sendSuccess(res, result, "Account created successfully", 201);
  }),

  login: asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const result = await authService.login(req.body, req.ip);
    sendSuccess(res, result, "Logged in successfully");
  }),

  refresh: asyncHandler(async (req: Request<unknown, unknown, RefreshInput>, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken, req.ip);
    sendSuccess(res, result, "Token refreshed successfully");
  }),

  logout: asyncHandler(async (req: Request<unknown, unknown, RefreshInput>, res: Response) => {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, null, "Logged out successfully");
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const input = req.body as UpdateProfileInput;
    const user = await authService.updateProfile(req.user.sub, input);
    sendSuccess(res, user, "Profile updated");
  }),

  // OAuth stubs — CLAUDE.md requires Google/Apple login, but no real client
  // IDs/secrets exist yet. Route plumbing is in place; wire up a passport
  // strategy (or manual OAuth code exchange) once credentials are provided.
  googleStub: (_req: Request, res: Response) => {
    sendError(
      res,
      501,
      "Google OAuth is not configured yet",
      { reason: "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" }
    );
  },

  appleStub: (_req: Request, res: Response) => {
    sendError(
      res,
      501,
      "Apple Sign In is not configured yet",
      { reason: "Missing APPLE_CLIENT_ID / APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY" }
    );
  },
};
