import type { Response } from "express";

/**
 * Standard success/error envelope used by every endpoint in this API.
 * Frontend agent contract: never deviate from this shape.
 */
export function sendSuccess<T>(res: Response, data: T, message = "", status = 200): Response {
  return res.status(status).json({ success: true, data, message });
}

export function sendError(
  res: Response,
  status: number,
  error: string,
  details: unknown = {}
): Response {
  return res.status(status).json({ success: false, error, details });
}
