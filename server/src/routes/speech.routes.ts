import { Router } from "express";
import multer from "multer";
import { speechController } from "../controllers/speech.controller";
import { speechService } from "../services/speech.service";
import { requireAuth } from "../middleware/auth";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const speechRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

speechRouter.use(requireAuth);

// Lets the frontend hide/disable recording UI until WHISPER_API_KEY +
// Supabase Storage are actually configured, same pattern as
// VocabularyWord.audioUrl being null until a TTS pipeline exists.
speechRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, { configured: speechService.isConfigured() });
  })
);

speechRouter.post("/transcribe", upload.single("audio"), speechController.transcribe);
