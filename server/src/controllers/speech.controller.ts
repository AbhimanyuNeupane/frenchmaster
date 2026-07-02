import type { Request, Response } from "express";
import { speechService } from "../services/speech.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { transcribeFieldsSchema } from "../validators/speech.validators";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB — a few minutes of compressed speech audio

export const speechController = {
  transcribe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();

    if (!speechService.isConfigured()) {
      throw ApiError.notImplemented("Pronunciation scoring is not configured yet", {
        reason: "Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE and/or WHISPER_API_KEY",
      });
    }

    const file = req.file;
    if (!file) {
      throw ApiError.badRequest("No audio file uploaded (expected multipart field 'audio')");
    }
    if (file.size > MAX_AUDIO_BYTES) {
      throw ApiError.badRequest("Audio file too large (max 10MB)");
    }

    const fields = transcribeFieldsSchema.parse(req.body);

    const result = await speechService.transcribeAndScore({
      userId: req.user.sub,
      audioBuffer: file.buffer,
      mimeType: file.mimetype,
      targetText: fields.targetText,
      source: fields.source,
      vocabularyWordId: fields.vocabularyWordId,
    });

    sendSuccess(res, result, "Pronunciation scored");
  }),
};
