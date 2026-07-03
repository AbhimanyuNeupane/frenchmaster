import { describe, it, expect, vi } from "vitest";

// --- Mocks: keep this a pure unit test, no real env/logger required. ---
// translationAi.service.ts imports `env` from ../config/env at module load
// time, and that module eagerly parses+validates process.env (exiting the
// process on failure) — this repo's local .env doesn't carry JWT secrets
// (they're supplied via the shell/Vercel env at runtime, not committed), so
// importing the real module here would crash the test run. Mock it out,
// same convention as lessonEngine.service.test.ts mocking ../config/prisma.
vi.mock("../config/env", () => ({
  env: { ANTHROPIC_API_KEY: undefined },
}));
vi.mock("../config/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { parseTranslationResponse, sanitizeTranslationResult } from "../services/translationAi.service";

describe("parseTranslationResponse", () => {
  it("parses direct, well-formed JSON", () => {
    const result = parseTranslationResponse('{"es": "hola", "ne": "नमस्ते"}');
    expect(result).toEqual({ es: "hola", ne: "नमस्ते" });
  });

  it("extracts a JSON object embedded in surrounding prose", () => {
    const result = parseTranslationResponse(
      'Sure, here is the translation:\n{"es": "hola"}\nLet me know if you need more.'
    );
    expect(result).toEqual({ es: "hola" });
  });

  it("extracts a JSON object wrapped in a markdown code fence", () => {
    const result = parseTranslationResponse('```json\n{"es": "hola"}\n```');
    expect(result).toEqual({ es: "hola" });
  });

  it("throws ApiError.badRequest on totally unparseable text", () => {
    expect(() => parseTranslationResponse("I cannot help with that.")).toThrow(
      "AI translation returned an unparseable response"
    );
  });

  it("throws on a JSON array (not an object)", () => {
    expect(() => parseTranslationResponse('["hola", "salut"]')).toThrow(
      "AI translation returned an unparseable response"
    );
  });

  it("throws on malformed JSON that also has no extractable {...} block", () => {
    expect(() => parseTranslationResponse('{"es": "hola"')).toThrow(
      "AI translation returned an unparseable response"
    );
  });
});

describe("sanitizeTranslationResult", () => {
  it("keeps only requested language codes with non-empty string values", () => {
    const result = sanitizeTranslationResult(
      { es: "hola", ne: "नमस्ते", fr: "bonjour" },
      ["es", "ne"]
    );
    expect(result).toEqual([
      { languageCode: "es", text: "hola" },
      { languageCode: "ne", text: "नमस्ते" },
    ]);
  });

  it("drops hallucinated extra keys not in the requested set", () => {
    const result = sanitizeTranslationResult({ es: "hola", zz: "unexpected" }, ["es"]);
    expect(result).toEqual([{ languageCode: "es", text: "hola" }]);
  });

  it("drops entries with empty/whitespace-only string values", () => {
    const result = sanitizeTranslationResult({ es: "hola", ne: "   " }, ["es", "ne"]);
    expect(result).toEqual([{ languageCode: "es", text: "hola" }]);
  });

  it("drops entries whose value isn't a string", () => {
    const result = sanitizeTranslationResult({ es: "hola", ne: 123 as unknown as string }, ["es", "ne"]);
    expect(result).toEqual([{ languageCode: "es", text: "hola" }]);
  });

  it("trims whitespace around a kept value", () => {
    const result = sanitizeTranslationResult({ es: "  hola  " }, ["es"]);
    expect(result).toEqual([{ languageCode: "es", text: "hola" }]);
  });

  it("returns an empty array when nothing matches the requested codes", () => {
    const result = sanitizeTranslationResult({ zz: "unrelated" }, ["es"]);
    expect(result).toEqual([]);
  });
});
