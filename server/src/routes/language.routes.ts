import { Router } from "express";
import { languageController } from "../controllers/language.controller";

export const languageRouter = Router();

// Deliberately NO requireAuth — the signup form needs this list before an
// account exists. Only enabled languages are ever returned.
languageRouter.get("/", languageController.listLanguages);
