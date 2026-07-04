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

    it("parses Part of Speech, Gender, Synonyms, Example, and Common Mistake columns", async () => {
      const csv =
        "French,English,Pronunciation,Part of Speech,Gender,Synonyms,Example (French),Example (English),Common Mistake\n" +
        'Le chat,Cat,/ʃa/,noun,masculine,"Le matou; Le félin",Le chat dort.,The cat sleeps.,Don\'t confuse with "chatte".\n';

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.rows[0].errors).toEqual([]);
      expect(result.rows[0].data.partOfSpeech).toBe("noun");
      expect(result.rows[0].data.gender).toBe("masculine");
      expect(result.rows[0].data.synonyms).toEqual(["Le matou", "Le félin"]);
      expect(result.rows[0].data.exampleFr).toBe("Le chat dort.");
      expect(result.rows[0].data.exampleEn).toBe("The cat sleeps.");
      expect(result.rows[0].data.commonMistake).toBe('Don\'t confuse with "chatte".');
    });

    it("flags an invalid Part of Speech or Gender value instead of importing it silently", async () => {
      const csv =
        "French,English,Pronunciation,Part of Speech,Gender\n" +
        "Le chien,Dog,/ʃjɛ̃/,animal,male\n";

      const result = await parseAndValidateCsv(Buffer.from(csv, "utf-8"));

      expect(result.rows[0].errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Invalid part of speech"),
          expect.stringContaining("Invalid gender"),
        ])
      );
    });
  });

  describe("revalidateImportRows", () => {
    it("re-validates server-side and never trusts client-supplied data blindly", async () => {
      mockFindVocabularyWordsByFrenchTexts.mockResolvedValue([]);

      const rows = await revalidateImportRows([
        {
          french: "Bonjour",
          english: "Hello",
          pronunciation: "/a/",
          category: "Greetings",
          partOfSpeech: "",
          gender: "",
          synonyms: [],
          exampleFr: "",
          exampleEn: "",
          commonMistake: "",
          translations: [],
        },
        {
          french: "",
          english: "Missing french",
          pronunciation: "/b/",
          category: "",
          partOfSpeech: "",
          gender: "",
          synonyms: [],
          exampleFr: "",
          exampleEn: "",
          commonMistake: "",
          translations: [],
        },
      ]);

      expect(rows[0].errors).toEqual([]);
      expect(rows[1].errors).toContain("Missing French text");
    });
  });
});
