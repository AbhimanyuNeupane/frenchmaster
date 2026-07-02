import type { Request, Response } from "express";
import { languageService } from "../services/language.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const languageController = {
  listLanguages: asyncHandler(async (_req: Request, res: Response) => {
    const languages = await languageService.listEnabledLanguages();
    sendSuccess(res, languages);
  }),
};
