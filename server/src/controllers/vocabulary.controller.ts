import type { Request, Response } from "express";
import { vocabularyService } from "../services/vocabulary.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { ListVocabularyQuery, VocabularyIdParam } from "../validators/vocabulary.validators";

// `validate()` overwrites req.query/req.params with the Zod-parsed (and thus
// coerced) values at runtime, but asyncHandler's signature is fixed to the
// plain Express Request type (see auth/dashboard controllers for the same
// convention), so the parsed shape is asserted here rather than threaded
// through generics that Express's Request<P, ResBody, ReqBody, ReqQuery>
// can't accept contravariantly.
export const vocabularyController = {
  getVocabulary: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const query = req.query as unknown as ListVocabularyQuery;
    const data = await vocabularyService.getVocabulary(req.user.sub, query);
    sendSuccess(res, data);
  }),

  toggleFavorite: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const { id } = req.params as unknown as VocabularyIdParam;
    const word = await vocabularyService.toggleFavorite(req.user.sub, id);
    sendSuccess(res, word, "Favorite updated");
  }),

  markReviewed: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const { id } = req.params as unknown as VocabularyIdParam;
    const word = await vocabularyService.markReviewed(req.user.sub, id);
    sendSuccess(res, word, "Marked as reviewed");
  }),
};
