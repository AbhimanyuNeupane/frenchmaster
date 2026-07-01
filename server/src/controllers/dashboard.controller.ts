import type { Request, Response } from "express";
import { dashboardService } from "@/services/dashboard.service";
import { sendSuccess } from "@/utils/apiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";

export const dashboardController = {
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const data = await dashboardService.getDashboard(req.user.sub);
    sendSuccess(res, data);
  }),
};
