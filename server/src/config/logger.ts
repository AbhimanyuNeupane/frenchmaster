import pino from "pino";
import { env, isProduction } from "./env";

/**
 * Structured logger. Pretty-printed in development, JSON in production.
 * Never log secrets: redact common sensitive keys defensively.
 */
export const logger = pino({
  level: isProduction ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
  base: { env: env.NODE_ENV },
});
