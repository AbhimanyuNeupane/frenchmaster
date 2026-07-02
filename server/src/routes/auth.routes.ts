import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { authRateLimiter } from "../middleware/rateLimiter";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from "../validators/auth.validators";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  authController.register
);

authRouter.post("/login", authRateLimiter, validate({ body: loginSchema }), authController.login);

authRouter.post(
  "/refresh",
  authRateLimiter,
  validate({ body: refreshSchema }),
  authController.refresh
);

authRouter.post(
  "/logout",
  validate({ body: refreshSchema }),
  authController.logout
);

authRouter.patch(
  "/me",
  requireAuth,
  validate({ body: updateProfileSchema }),
  authController.updateProfile
);

// OAuth stubs — see auth.controller.ts for why these 501 today.
authRouter.get("/google", authController.googleStub);
authRouter.get("/apple", authController.appleStub);
