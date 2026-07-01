/**
 * Thrown from services/controllers to signal a well-understood, expected
 * failure (bad input, auth failure, not found, conflict, etc). Caught by
 * the centralized error middleware and turned into the standard error
 * envelope with the right HTTP status. Anything else (unexpected
 * exceptions) is treated as a 500 and never leaks internals to the client.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, details: unknown = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized", details?: unknown) {
    return new ApiError(401, message, details);
  }
  static forbidden(message = "Forbidden", details?: unknown) {
    return new ApiError(403, message, details);
  }
  static notFound(message = "Not found", details?: unknown) {
    return new ApiError(404, message, details);
  }
  static conflict(message = "Conflict", details?: unknown) {
    return new ApiError(409, message, details);
  }
  static unprocessable(message = "Unprocessable entity", details?: unknown) {
    return new ApiError(422, message, details);
  }
  static tooManyRequests(message = "Too many requests", details?: unknown) {
    return new ApiError(429, message, details);
  }
  static internal(message = "Internal server error", details?: unknown) {
    return new ApiError(500, message, details);
  }
  static notImplemented(message = "Not implemented", details?: unknown) {
    return new ApiError(501, message, details);
  }
}
