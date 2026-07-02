import type { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type {
  CreateVocabularyWordInput,
  ListUsersQuery,
  UpdateUserInput,
  UpdateVocabularyWordInput,
  UserIdParam,
  VocabularyWordIdParam,
} from "../validators/admin.validators";

// Same convention as vocabulary.controller.ts: `validate()` has already
// overwritten req.query/req.params/req.body with the Zod-parsed values at
// runtime; the cast below just reflects that at the type level.
export const adminController = {
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const data = await adminService.listUsers(query);
    sendSuccess(res, data);
  }),

  updateUser: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const { id } = req.params as unknown as UserIdParam;
    const input = req.body as UpdateUserInput;
    const user = await adminService.updateUser(req.user.sub, id, input);
    sendSuccess(res, user, "User updated");
  }),

  getAnalyticsOverview: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getAnalyticsOverview();
    sendSuccess(res, data);
  }),

  listVocabularyWords: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const data = await adminService.listVocabularyWords(page, pageSize);
    sendSuccess(res, data);
  }),

  createVocabularyWord: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateVocabularyWordInput;
    const word = await adminService.createVocabularyWord(input);
    sendSuccess(res, word, "Vocabulary word created", 201);
  }),

  updateVocabularyWord: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as VocabularyWordIdParam;
    const input = req.body as UpdateVocabularyWordInput;
    const word = await adminService.updateVocabularyWord(id, input);
    sendSuccess(res, word, "Vocabulary word updated");
  }),

  deleteVocabularyWord: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as VocabularyWordIdParam;
    await adminService.deleteVocabularyWord(id);
    sendSuccess(res, null, "Vocabulary word deleted");
  }),
};
