import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/apiResponse";
import { logger } from "../config/logger";
import { isProduction } from "../config/env";

/**
 * Single source of truth for turning any thrown error into the standard
 * error envelope. Must be registered last, after all routes.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    sendError(res, 422, "Validation failed", { fieldErrors: err.flatten().fieldErrors });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, "Operational error (5xx)");
    } else {
      logger.warn({ err: err.message, path: req.path }, "Operational error");
    }
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  // Unexpected error — never leak internals/stack traces to the client.
  logger.error({ err, path: req.path }, "Unhandled error");
  sendError(
    res,
    500,
    "Internal server error",
    isProduction ? {} : { message: (err as Error)?.message, stack: (err as Error)?.stack }
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}
