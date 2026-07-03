import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks: keep this a pure unit test, no live DB required. ---

const mockLanguageFindMany = vi.fn();
vi.mock("../config/prisma", () => ({
  prisma: {
    language: { findMany: (...args: unknown[]) => mockLanguageFindMany(...args) },
  },
}));

const mockFindVocabularyWordsByFrenchTexts = vi.fn();
vi.mock("../repositories/admin.repository", () => ({
  adminRepository: {
    findVocabularyWordsByFrenchTexts: (...args: unknown[]) => mockFindVocabularyWordsByFrenchTexts(...args),
  },
}));

import { parseAndValidateCsv, revalidateImportRows } from "../services/vocabularyImport.service";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ne", name: "Nepali" },
  { code: "hi", name: "Hindi" },
];

describe("vocabularyImport.service", () => {
  beforeEach(() => {
    mockLanguageFindMany.mockReset().mockResolvedValue(LANGUAGES);
    mockFindVocabularyWordsByFrenchTexts.mockReset().mockResolvedValue([]);
  });

  describe("parseAndValidateCsv", () => {
    it("parses a well-formed CSV into valid rows with native-language translations", async () => {
      const csv =
        "French,English,Nepali,Hindi,Pronunciation\n" +
        "Bonjour,Hello,नमस्ते,प्रणाम,/bɔ̃.ʒuʁ/\n" +
        "Merci,Thank you,धन्यवाद,धन्यवाद,/mɛʁ.si/\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.fatalError).toBeUndefined();
      expect(result.totalRows).toBe(2);
      expect(result.validRowCount).toBe(2);
      expect(result.errorRowCount).toBe(0);
      expect(result.unrecognizedColumns).toEqual([]);

      const bonjour = result.rows[0];
      expect(bonjour.data.french).toBe("Bonjour");
      expect(bonjour.data.english).toBe("Hello");
      expect(bonjour.data.translations).toEqual(
        expect.arrayContaining([
          { languageCode: "ne", text: "नमस्ते" },
          { languageCode: "hi", text: "प्रणाम" },
        ])
      );
      expect(bonjour.errors).toEqual([]);
    });

    it("flags a row missing French text and a row missing English translation", async () => {
      const csv = "French,English,Pronunciation\n" + ",Hello,/a/\n" + "Salut,,/b/\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.rows[0].errors).toContain("Missing French text");
      expect(result.rows[1].errors).toContain("Missing English translation");
      expect(result.validRowCount).toBe(0);
    });

    it("flags empty pronunciation cells when a Pronunciation column is present", async () => {
      const csv = "French,English,Pronunciation\n" + "Bonjour,Hello,\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.rows[0].errors).toContain("Empty pronunciation");
    });

    it("flags duplicate vocabulary repeated within the same file", async () => {
      const csv = "French,English,Pronunciation\n" + "Bonjour,Hello,/a/\n" + "bonjour,Hi,/b/\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.rows[0].errors).not.toContain("Duplicate vocabulary: repeated in file");
      expect(result.rows[1].errors).toContain("Duplicate vocabulary: repeated in file");
    });

    it("flags duplicate vocabulary that already exists in the live catalog", async () => {
      mockFindVocabularyWordsByFrenchTexts.mockResolvedValue([{ id: "w1", french: "Bonjour" }]);
      const csv = "French,English,Pronunciation\n" + "Bonjour,Hello,/a/\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.rows[0].errors).toContain("Duplicate vocabulary: already exists");
    });

    it("reports unrecognized columns as a warning, not a per-row error", async () => {
      const csv = "French,English,Pronunciation,Klingon\n" + "Bonjour,Hello,/a/,Qapla\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.unrecognizedColumns).toEqual(["Klingon"]);
      expect(result.rows[0].errors).toEqual([]);
    });

    it("returns a fatal error when the French column is missing entirely", async () => {
      const csv = "English,Pronunciation\nHello,/a/\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.fatalError).toMatch(/French/);
      expect(result.rows).toEqual([]);
    });

    it("returns a fatal error on invalid UTF-8 input", async () => {
      // A lone continuation byte (0x80) is invalid as the start of a UTF-8 sequence.
      const invalidUtf8 = Buffer.from([0x46, 0x80, 0xfe, 0xff]);

      const result = await parseAndValidateCsv(invalidUtf8);

      expect(result.fatalError).toBe("Invalid UTF-8 encoding");
    });
  });

  describe("revalidateImportRows", () => {
    it("re-validates server-side and never trusts client-supplied data blindly", async () => {
      mockFindVocabularyWordsByFrenchTexts.mockResolvedValue([]);

      const rows = await revalidateImportRows([
        { french: "Bonjour", english: "Hello", pronunciation: "/a/", category: "Greetings", translations: [] },
        { french: "", english: "Missing french", pronunciation: "/b/", category: "", translations: [] },
      ]);

      expect(rows[0].errors).toEqual([]);
      expect(rows[1].errors).toContain("Missing French text");
    });
  });
});
