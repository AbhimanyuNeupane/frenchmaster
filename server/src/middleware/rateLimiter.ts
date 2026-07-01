import rateLimit from "express-rate-limit";

/**
 * General API rate limiter — generous, just a backstop against abuse.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later.", details: {} },
});

/**
 * Stricter limiter for auth endpoints to slow down credential stuffing /
 * brute force attempts against login and registration.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later.",
    details: {},
  },
});
