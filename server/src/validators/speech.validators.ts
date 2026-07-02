import { z } from "zod";
import { idSchema } from "./common";

// Multipart form fields arrive as strings on req.body (the audio file itself
// is handled separately by multer, see speech.routes.ts).
export const transcribeFieldsSchema = z.object({
  targetText: z.string().trim().min(1).max(1000),
  source: z.enum(["vocabulary_word", "exercise", "exam_speaking"]),
  vocabularyWordId: idSchema.optional(),
});

export type TranscribeFields = z.infer<typeof transcribeFieldsSchema>;
