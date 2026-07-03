import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// Cheap/fast model — plenty for a short single-word/phrase translation task.
const ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

export interface TranslateWordInput {
  french: string;
  partOfSpeech: string;
  exampleFr?: string | null;
  level: string;
  targetLanguages: { code: string; name: string }[];
}

export interface TranslationSuggestion {
  languageCode: string;
  text: string;
}

/**
 * Defensive parse of the model's text output: try `JSON.parse` directly,
 * then fall back to extracting the first `{...}` block (models sometimes
 * wrap JSON in a sentence or markdown fence despite instructions). Throws a
 * clear, caller-facing error rather than silently returning garbage if
 * neither attempt parses. Exported for unit testing — this is the one part
 * of this module that's meaningfully pure/testable without a network call.
 */
export function parseTranslationResponse(text: string): Record<string, unknown> {
  try {
    const direct = JSON.parse(text) as unknown;
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct as Record<string, unknown>;
    }
  } catch {
    // fall through to regex extraction
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const extracted = JSON.parse(match[0]) as unknown;
      if (extracted && typeof extracted === "object" && !Array.isArray(extracted)) {
        return extracted as Record<string, unknown>;
      }
    } catch {
      // fall through to the error below
    }
  }

  throw ApiError.badRequest("AI translation returned an unparseable response");
}

/**
 * Filters a raw parsed AI response down to only the requested language
 * codes with non-empty string values — drops any hallucinated extra keys
 * and any non-string/empty values rather than trusting the model's output
 * shape. Exported for unit testing.
 */
export function sanitizeTranslationResult(
  parsed: Record<string, unknown>,
  requestedCodes: string[]
): TranslationSuggestion[] {
  const requested = new Set(requestedCodes);
  return Object.entries(parsed)
    .filter((entry): entry is [string, string] => {
      const [code, value] = entry;
      return requested.has(code) && typeof value === "string" && value.trim().length > 0;
    })
    .map(([languageCode, value]) => ({ languageCode, text: value.trim() }));
}

export const translationAiService = {
  isConfigured(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY);
  },

  /**
   * Translates a single French word/phrase into each requested target
   * language via Anthropic's Messages API. Throws ApiError.notImplemented
   * if ANTHROPIC_API_KEY isn't configured, mirroring
   * speech.service.ts's isConfigured()/501 convention. Never writes to the
   * database — this is a pure "ask the model, return suggestions" call;
   * callers decide whether/how to persist the result.
   */
  async translateWord(input: TranslateWordInput): Promise<TranslationSuggestion[]> {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw ApiError.notImplemented("AI translation is not configured yet", {
        reason: "Missing ANTHROPIC_API_KEY",
      });
    }

    if (input.targetLanguages.length === 0) {
      return [];
    }

    const requestedCodes = input.targetLanguages.map((l) => l.code);
    const languageList = input.targetLanguages.map((l) => `${l.code} (${l.name})`).join(", ");

    const systemPrompt =
      "You are a professional French-to-many-languages translator for a language-learning app. " +
      "Translate the given French word or phrase into each requested target language, preserving " +
      "its register (formal/informal) and part of speech. Respond with ONLY a single JSON object " +
      "mapping each requested language code to its translation string — no prose, no markdown " +
      "fences, no explanation, no extra keys.";

    const userPrompt = [
      `French word/phrase: "${input.french}"`,
      `Part of speech: ${input.partOfSpeech}`,
      `CEFR level: ${input.level}`,
      input.exampleFr ? `Example sentence for context: "${input.exampleFr}"` : null,
      `Target languages (code (name)): ${languageList}`,
      `Respond with a JSON object using exactly these keys: ${requestedCodes.join(", ")}.`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error({ status: response.status, body }, "Anthropic translation request failed");
      throw ApiError.internal("AI translation request failed");
    }

    const result = (await response.json()) as { content?: { type: string; text?: string }[] };
    const text = result.content?.find((block) => block.type === "text")?.text ?? "";

    const parsed = parseTranslationResponse(text);
    return sanitizeTranslationResult(parsed, requestedCodes);
  },
};
