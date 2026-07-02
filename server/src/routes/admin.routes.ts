import { Router } from "express";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ApiError } from "../utils/ApiError";
import {
  commitVocabularyImportSchema,
  createLanguageSchema,
  createVocabularyWordSchema,
  languageCodeParamSchema,
  listUsersSchema,
  updateLanguageSchema,
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

// --- Vocabulary CSV import/export ---

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req: Request, file, cb: FileFilterCallback) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      cb(ApiError.badRequest("Only .csv files are accepted"));
      return;
    }
    cb(null, true);
  },
});

// Static sub-paths ("/import/example", "/export") are registered before
// the CRUD "/vocabulary" routes above only matter for :id-style dynamic
// segments — none collide here, but kept grouped for readability.
adminRouter.get("/vocabulary/import/example", adminController.downloadImportExample);
adminRouter.post(
  "/vocabulary/import/preview",
  csvUpload.single("file"),
  adminController.previewVocabularyImport
);
adminRouter.post(
  "/vocabulary/import/commit",
  validate({ body: commitVocabularyImportSchema }),
  adminController.commitVocabularyImport
);
adminRouter.get("/vocabulary/export", adminController.exportVocabulary);

// --- Language management ---

adminRouter.get("/languages", adminController.listLanguages);
adminRouter.post(
  "/languages",
  validate({ body: createLanguageSchema }),
  adminController.createLanguage
);
adminRouter.patch(
  "/languages/:code",
  validate({ params: languageCodeParamSchema, body: updateLanguageSchema }),
  adminController.updateLanguage
);
