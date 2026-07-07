import type { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type {
  AiTranslateBulkInput,
  AiTranslateSingleInput,
  CommitVocabularyImportInput,
  CreateLanguageInput,
  CreateRoleInput,
  CreateVocabularyWordInput,
  LanguageCodeParam,
  ListUsersQuery,
  RoleIdParam,
  UpdateLanguageInput,
  UpdateRoleInput,
  UpdateUserInput,
  UpdateVocabularyCategoryInput,
  UpdateVocabularyWordInput,
  UserIdParam,
  VocabularyCategoryNameParam,
  VocabularyWordIdParam,
} from "../validators/admin.validators";

const MAX_IMPORT_CSV_BYTES = 2 * 1024 * 1024; // 2MB

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
    const category =
      typeof req.query.category === "string" && req.query.category.trim().length > 0
        ? req.query.category.trim()
        : undefined;
    const data = await adminService.listVocabularyWords(page, pageSize, category);
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

  // --- Vocabulary CSV import/export ---

  previewVocabularyImport: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest("No CSV file uploaded (expected multipart field 'file')");
    }
    if (file.size > MAX_IMPORT_CSV_BYTES) {
      throw ApiError.badRequest("CSV file too large (max 2MB)");
    }
    const result = await adminService.previewVocabularyImport(file.buffer);
    sendSuccess(res, result);
  }),

  commitVocabularyImport: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CommitVocabularyImportInput;
    const result = await adminService.commitVocabularyImport(input);
    sendSuccess(res, result, "Vocabulary import completed");
  }),

  downloadImportExample: asyncHandler(async (_req: Request, res: Response) => {
    const csv = await adminService.buildExampleCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="vocabulary-import-example.csv"');
    res.status(200).send(csv);
  }),

  exportVocabulary: asyncHandler(async (_req: Request, res: Response) => {
    const csv = await adminService.buildExportCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="vocabulary-export.csv"');
    res.status(200).send(csv);
  }),

  // --- AI-assisted vocabulary translation ---

  getAiTranslateStatus: asyncHandler(async (_req: Request, res: Response) => {
    const data = adminService.aiTranslateStatus();
    sendSuccess(res, data);
  }),

  suggestVocabularyTranslations: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as VocabularyWordIdParam;
    const input = req.body as AiTranslateSingleInput;
    const suggestions = await adminService.suggestVocabularyTranslations(id, input);
    sendSuccess(res, suggestions);
  }),

  bulkFillVocabularyTranslations: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as AiTranslateBulkInput;
    const result = await adminService.bulkFillVocabularyTranslations(input);
    sendSuccess(res, result, "AI bulk translation completed");
  }),

  // --- Language management ---

  listLanguages: asyncHandler(async (_req: Request, res: Response) => {
    const languages = await adminService.listLanguages();
    sendSuccess(res, languages);
  }),

  createLanguage: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateLanguageInput;
    const language = await adminService.createLanguage(input);
    sendSuccess(res, language, "Language created", 201);
  }),

  updateLanguage: asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params as unknown as LanguageCodeParam;
    const input = req.body as UpdateLanguageInput;
    const language = await adminService.updateLanguage(code, input);
    sendSuccess(res, language, "Language updated");
  }),

  // --- Vocabulary category presentation ---

  listVocabularyCategories: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await adminService.listVocabularyCategories();
    sendSuccess(res, categories);
  }),

  updateVocabularyCategory: asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params as unknown as VocabularyCategoryNameParam;
    const input = req.body as UpdateVocabularyCategoryInput;
    const category = await adminService.updateVocabularyCategory(name, input);
    sendSuccess(res, category, "Category updated");
  }),

  // --- RBAC: roles & permissions ---

  listRoles: asyncHandler(async (_req: Request, res: Response) => {
    const roles = await adminService.listRoles();
    sendSuccess(res, roles);
  }),

  listPermissions: asyncHandler(async (_req: Request, res: Response) => {
    const permissions = await adminService.listPermissions();
    sendSuccess(res, permissions);
  }),

  createRole: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateRoleInput;
    const role = await adminService.createRole(input);
    sendSuccess(res, role, "Role created", 201);
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as RoleIdParam;
    const input = req.body as UpdateRoleInput;
    const role = await adminService.updateRole(id, input);
    sendSuccess(res, role, "Role updated");
  }),

  deleteRole: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as RoleIdParam;
    await adminService.deleteRole(id);
    sendSuccess(res, null, "Role deleted");
  }),
};
