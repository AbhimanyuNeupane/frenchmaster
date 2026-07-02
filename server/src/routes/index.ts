import { Router } from "express";
import { authRouter } from "./auth.routes";
import { dashboardRouter } from "./dashboard.routes";
import { vocabularyRouter } from "./vocabulary.routes";
import { adminRouter } from "./admin.routes";
import { lessonRouter } from "./lesson.routes";
import { speechRouter } from "./speech.routes";
import { languageRouter } from "./language.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/vocabulary", vocabularyRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/lessons", lessonRouter);
apiRouter.use("/speech", speechRouter);
apiRouter.use("/languages", languageRouter);
