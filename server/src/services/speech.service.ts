import { randomUUID } from "node:crypto";
import { env } from "../config/env";
import { getSupabaseStorageClient, isStorageConfigured, PRONUNCIATION_AUDIO_BUCKET } from "../config/supabaseStorage";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import type { PronunciationSource } from "@prisma/client";

function isWhisperConfigured(): boolean {
  return Boolean(env.WHISPER_API_KEY ?? env.OPENAI_API_KEY);
}

/**
 * Levenshtein edit distance, normalized to a 0-100 "similarity" score.
 * Deliberately simple (word-level Whisper transcript vs. target text) —
 * this is a scoring FLOOR to prove the pipeline end-to-end, not a real
 * phoneme-level pronunciation model. Revisit once real usage data exists;
 * see docs/BACKEND_STATUS.md open questions.
 */
function similarityScore(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1.length === 0 && s2.length === 0) return 100;

  const rows = s1.length + 1;
  const cols = s2.length + 1;
  const dist: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) dist[i][0] = i;
  for (let j = 0; j < cols; j++) dist[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost);
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  const editDistance = dist[rows - 1][cols - 1];
  return Math.round((1 - editDistance / maxLen) * 100);
}

export const speechService = {
  isConfigured(): boolean {
    return isStorageConfigured() && isWhisperConfigured();
  },

  /**
   * Uploads the recording to Supabase Storage, transcribes it via Whisper,
   * scores the transcript against the target text, and persists a
   * PronunciationAttempt row. Throws ApiError.notImplemented if storage or
   * the Whisper key isn't configured yet — callers should check
   * isConfigured() first if they want to short-circuit before accepting an
   * upload (see speech.controller.ts).
   */
  async transcribeAndScore(params: {
    userId: string;
    audioBuffer: Buffer;
    mimeType: string;
    targetText: string;
    source: PronunciationSource;
    vocabularyWordId?: string;
  }) {
    if (!isStorageConfigured()) {
      throw ApiError.notImplemented("Audio storage is not configured yet", {
        reason: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE",
      });
    }
    if (!isWhisperConfigured()) {
      throw ApiError.notImplemented("Speech transcription is not configured yet", {
        reason: "Missing WHISPER_API_KEY / OPENAI_API_KEY",
      });
    }

    const audioUrl = await this.uploadAudio(params.userId, params.audioBuffer, params.mimeType);
    const transcript = await this.transcribe(params.audioBuffer, params.mimeType);
    const score = similarityScore(transcript, params.targetText);

    const attempt = await prisma.pronunciationAttempt.create({
      data: {
        userId: params.userId,
        source: params.source,
        targetText: params.targetText,
        audioUrl,
        transcript,
        score,
        vocabularyWordId: params.vocabularyWordId ?? null,
      },
    });

    return {
      id: attempt.id,
      audioUrl,
      transcript,
      score,
      targetText: params.targetText,
    };
  },

  async uploadAudio(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : "wav";
    const path = `${userId}/${randomUUID()}.${extension}`;

    const supabase = getSupabaseStorageClient();
    const { error } = await supabase.storage
      .from(PRONUNCIATION_AUDIO_BUCKET)
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (error) {
      logger.error({ error }, "Supabase Storage upload failed");
      throw ApiError.internal("Failed to store audio recording");
    }

    const { data } = supabase.storage.from(PRONUNCIATION_AUDIO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  async transcribe(buffer: Buffer, mimeType: string): Promise<string> {
    const apiKey = env.WHISPER_API_KEY ?? env.OPENAI_API_KEY;
    const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : "wav";

    const form = new FormData();
    form.append("file", new Blob([buffer], { type: mimeType }), `audio.${extension}`);
    form.append("model", "whisper-1");
    form.append("language", "fr");

    const response = await fetch(env.WHISPER_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error({ status: response.status, body }, "Whisper transcription request failed");
      throw ApiError.internal("Speech transcription failed");
    }

    const result = (await response.json()) as { text: string };
    return result.text;
  },
};
