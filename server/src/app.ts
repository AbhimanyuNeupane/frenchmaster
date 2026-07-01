import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { apiRouter } from "@/routes";
import { healthRouter } from "@/routes/health.routes";
import { apiRateLimiter } from "@/middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (Railway/AWS/etc load balancer) so req.ip and
  // rate limiting see the real client IP rather than the proxy's.
  app.set("trust proxy", 1);

  app.use(helmet());

  // Explicit allowlist — never reflect an arbitrary Origin header.
  const allowedOrigins = [env.NEXT_PUBLIC_APP_URL];
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

  app.use(apiRateLimiter);

  app.use("/health", healthRouter);
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
