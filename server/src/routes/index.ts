import { Router } from "express";
import { authRouter } from "./auth.routes";
import { dashboardRouter } from "./dashboard.routes";
import { vocabularyRouter } from "./vocabulary.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/vocabulary", vocabularyRouter);
apiRouter.use("/admin", adminRouter);
