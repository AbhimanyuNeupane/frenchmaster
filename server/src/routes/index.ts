import { Router } from "express";
import { authRouter } from "@/routes/auth.routes";
import { dashboardRouter } from "@/routes/dashboard.routes";
import { vocabularyRouter } from "@/routes/vocabulary.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/vocabulary", vocabularyRouter);
