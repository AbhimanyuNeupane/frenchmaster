import { Router } from "express";
import { authRouter } from "./auth.routes";
import { dashboardRouter } from "./dashboard.routes";
import { vocabularyRouter } from "./vocabulary.routes";
import { adminRouter } from "./admin.routes";
import { lessonRouter } from "./lesson.routes";
import { speechRouter } from "./speech.routes";
import { languageRouter } from "./language.routes";
import { lessonEngineAdminRouter } from "./lessonEngineAdmin.routes";
import { lessonEnginePublicRouter } from "./lessonEnginePublic.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/vocabulary", vocabularyRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/admin/lesson-engine", lessonEngineAdminRouter);
apiRouter.use("/lessons", lessonRouter);
apiRouter.use("/speech", speechRouter);
apiRouter.use("/languages", languageRouter);
apiRouter.use("/lesson-engine", lessonEnginePublicRouter);
