import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

/**
 * Validates request params/query/body/headers against Zod schemas and
 * replaces `req.*` with the parsed (and thus coerced/defaulted) values.
 * Throws ZodError on failure, caught by the centralized error handler and
 * turned into a 422 with field-level details.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.headers) {
      schemas.headers.parse(req.headers);
    }
    next();
  };
}
