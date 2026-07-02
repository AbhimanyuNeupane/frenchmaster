import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, dashboardController.getDashboard);
