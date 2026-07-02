import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createVocabularyWordSchema,
  listUsersSchema,
  updateUserSchema,
  updateVocabularyWordSchema,
  userIdParamSchema,
  vocabularyWordIdParamSchema,
} from "../validators/admin.validators";

export const adminRouter = Router();

// Every route in this file is admin-only.
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/users", validate({ query: listUsersSchema }), adminController.listUsers);
adminRouter.patch(
  "/users/:id",
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  adminController.updateUser
);

adminRouter.get("/analytics/overview", adminController.getAnalyticsOverview);

adminRouter.get("/vocabulary", adminController.listVocabularyWords);
adminRouter.post(
  "/vocabulary",
  validate({ body: createVocabularyWordSchema }),
  adminController.createVocabularyWord
);
adminRouter.patch(
  "/vocabulary/:id",
  validate({ params: vocabularyWordIdParamSchema, body: updateVocabularyWordSchema }),
  adminController.updateVocabularyWord
);
adminRouter.delete(
  "/vocabulary/:id",
  validate({ params: vocabularyWordIdParamSchema }),
  adminController.deleteVocabularyWord
);
