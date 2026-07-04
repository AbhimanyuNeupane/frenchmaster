import Papa from "papaparse";
import { prisma } from "../config/prisma";
import { adminRepository, type TranslationEntryInput } from "../repositories/admin.repository";

const VALID_PARTS_OF_SPEECH = ["noun", "verb", "adjective", "adverb", "phrase", "expression"] as const;
const VALID_GENDERS = ["masculine", "feminine", "neutral"] as const;
type PartOfSpeech = (typeof VALID_PARTS_OF_SPEECH)[number];
type Gender = (typeof VALID_GENDERS)[number];

/** A single parsed/validated CSV row, ready for admin preview or commit. */
export interface ImportRowResult {
  rowNumber: number; // 1-based, counting data rows only (header excluded)
  data: {
    french: string;
    english: string;
    pronunciation: string;
    /** Per-row category (from an optional "Category"/"Unit" CSV column). Empty
     *  string means "no per-row category" — the commit step falls back to the
     *  batch-level unitTitle the admin picked, never forcing every row in a
     *  mixed-topic file into one category. */
    category: string;
    /** Empty string means "not provided" — commit defaults to "noun", matching the pre-existing behavior. */
    partOfSpeech: string;
    /** Empty string means "not provided" — commit defaults to null (non-noun / not applicable). */
    gender: string;
    /** Semicolon-separated in the CSV cell (e.g. "Salut; Coucou") — already split here. */
    synonyms: string[];
    exampleFr: string;
    exampleEn: string;
    commonMistake: string;
    translations: TranslationEntryInput[];
  };
  errors: string[];
}

export interface CsvValidationResult {
  rows: ImportRowResult[];
  totalRows: number;
  validRowCount: number;
  errorRowCount: number;
  unrecognizedColumns: string[];
  /** Set when parsing couldn't proceed at all (bad encoding, missing required column). */
  fatalError?: string;
}

/** Canonical row shape shared between CSV-parsed rows and commit-endpoint JSON rows. */
interface RawImportRow {
  french: string;
  english: string;
  pronunciation: string;
  category: string;
  partOfSpeech: string;
  gender: string;
  synonyms: string[];
  exampleFr: string;
  exampleEn: string;
  commonMistake: string;
  translations: TranslationEntryInput[];
}

/**
 * Validates a batch of already-structured rows: missing French, missing
 * English, empty pronunciation (required — VocabularyWord.pronunciationIpa
 * is a non-null DB column), invalid Part of Speech / Gender (if the column
 * was present and the cell wasn't empty — an unrecognized value is an error,
 * not silently ignored, since a typo there would otherwise import
 * mislabeled data), and duplicate vocabulary (case-insensitive French text,
 * either repeated earlier in the same batch or already present in the live
 * catalog). Duplicate-against-DB is checked with a single findMany, never
 * N+1.
 *
 * Shared by both the CSV preview endpoint and the commit endpoint — the
 * commit endpoint MUST NOT trust client-supplied `errors`, so it re-runs
 * this exact function against the rows it receives.
 */
async function validateRows(rawRows: RawImportRow[]): Promise<ImportRowResult[]> {
  const frenchValues = rawRows.map((r) => r.french.trim()).filter((v) => v.length > 0);
  const existing = await adminRepository.findVocabularyWordsByFrenchTexts(frenchValues);
  const existingFrenchSet = new Set(existing.map((w) => w.french.trim().toLowerCase()));

  const seenFrench = new Set<string>();

  return rawRows.map((raw, index) => {
    const rowNumber = index + 1;
    const french = raw.french.trim();
    const english = raw.english.trim();
    const pronunciation = raw.pronunciation.trim();
    const partOfSpeech = raw.partOfSpeech.trim();
    const gender = raw.gender.trim();
    const errors: string[] = [];

    if (!french) errors.push("Missing French text");
    if (!english) errors.push("Missing English translation");
    if (!pronunciation) errors.push("Empty pronunciation");

    if (partOfSpeech && !VALID_PARTS_OF_SPEECH.includes(partOfSpeech.toLowerCase() as PartOfSpeech)) {
      errors.push(
        `Invalid part of speech "${partOfSpeech}" (expected one of: ${VALID_PARTS_OF_SPEECH.join(", ")})`
      );
    }
    if (gender && !VALID_GENDERS.includes(gender.toLowerCase() as Gender)) {
      errors.push(`Invalid gender "${gender}" (expected one of: ${VALID_GENDERS.join(", ")})`);
    }

    if (french) {
      const key = french.toLowerCase();
      if (existingFrenchSet.has(key)) {
        errors.push("Duplicate vocabulary: already exists");
      } else if (seenFrench.has(key)) {
        errors.push("Duplicate vocabulary: repeated in file");
      } else {
        seenFrench.add(key);
      }
    }

    return {
      rowNumber,
      data: {
        french,
        english,
        pronunciation,
        category: raw.category.trim(),
        partOfSpeech,
        gender,
        synonyms: raw.synonyms,
        exampleFr: raw.exampleFr.trim(),
        exampleEn: raw.exampleEn.trim(),
        commonMistake: raw.commonMistake.trim(),
        translations: raw.translations,
      },
      errors,
    };
  });
}

/**
 * Parses + validates an uploaded CSV buffer. Recognized columns
 * (case-insensitive, trimmed, several accepted spellings per field):
 *   - French (required), English (required)
 *   - Pronunciation (required per row, but the column itself is optional —
 *     its absence just means every row fails "Empty pronunciation")
 *   - Category / Unit (optional, per-row — see below)
 *   - Part of Speech / POS (optional; must be one of noun/verb/adjective/
 *     adverb/phrase/expression if the cell is non-empty)
 *   - Gender (optional; must be one of masculine/feminine/neutral if the
 *     cell is non-empty)
 *   - Synonyms (optional; semicolon-separated within the cell, e.g. "Salut;
 *     Coucou")
 *   - Example (French) / Example French, Example (English) / Example
 *     English (optional)
 *   - Common Mistake (optional)
 *   - any column whose header matches an existing Language.name
 *     (case-insensitively) — those become per-row `translations` entries
 * Any other header is reported as an unrecognized column (a warning, not a
 * per-row error).
 *
 * Category/Unit is deliberately per-ROW, not just the batch-level unitTitle
 * the admin picks in the import form: a single CSV can legitimately mix
 * topics (greetings, food, numbers, ...), and forcing every row into one
 * category was a real production issue (a real ~185-word A1 vocabulary
 * import all landing under "Greeting"). A row with an empty/missing
 * Category cell falls back to the batch-level unitTitle at commit time.
 */
export async function parseAndValidateCsv(buffer: Buffer): Promise<CsvValidationResult> {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return {
      rows: [],
      totalRows: 0,
      validRowCount: 0,
      errorRowCount: 0,
      unrecognizedColumns: [],
      fatalError: "Invalid UTF-8 encoding",
    };
  }

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const languages = await prisma.language.findMany({ select: { code: true, name: true } });
  const nameToCode = new Map(languages.map((l) => [l.name.trim().toLowerCase(), l.code]));

  let frenchHeader: string | undefined;
  let englishHeader: string | undefined;
  let pronunciationHeader: string | undefined;
  let categoryHeader: string | undefined;
  let partOfSpeechHeader: string | undefined;
  let genderHeader: string | undefined;
  let synonymsHeader: string | undefined;
  let exampleFrHeader: string | undefined;
  let exampleEnHeader: string | undefined;
  let commonMistakeHeader: string | undefined;
  const languageColumns: { header: string; code: string }[] = [];
  const unrecognizedColumns: string[] = [];

  for (const header of headers) {
    const normalized = header.trim().toLowerCase();
    if (normalized === "french") frenchHeader = header;
    else if (normalized === "english") englishHeader = header;
    else if (normalized === "pronunciation") pronunciationHeader = header;
    else if (normalized === "category" || normalized === "unit" || normalized === "unittitle") {
      categoryHeader = header;
    } else if (normalized === "part of speech" || normalized === "partofspeech" || normalized === "pos") {
      partOfSpeechHeader = header;
    } else if (normalized === "gender") {
      genderHeader = header;
    } else if (normalized === "synonyms" || normalized === "synonym") {
      synonymsHeader = header;
    } else if (normalized === "example (french)" || normalized === "example french" || normalized === "examplefr") {
      exampleFrHeader = header;
    } else if (normalized === "example (english)" || normalized === "example english" || normalized === "exampleen") {
      exampleEnHeader = header;
    } else if (normalized === "common mistake" || normalized === "commonmistake") {
      commonMistakeHeader = header;
    } else if (nameToCode.has(normalized)) {
      languageColumns.push({ header, code: nameToCode.get(normalized)! });
    } else {
      unrecognizedColumns.push(header);
    }
  }

  if (!frenchHeader) {
    return {
      rows: [],
      totalRows: 0,
      validRowCount: 0,
      errorRowCount: 0,
      unrecognizedColumns,
      fatalError: 'Missing required column: "French"',
    };
  }
  if (!englishHeader) {
    return {
      rows: [],
      totalRows: 0,
      validRowCount: 0,
      errorRowCount: 0,
      unrecognizedColumns,
      fatalError: 'Missing required column: "English"',
    };
  }

  const rawRows: RawImportRow[] = parsed.data.map((raw) => ({
    french: (raw[frenchHeader as string] ?? "").trim(),
    english: (raw[englishHeader as string] ?? "").trim(),
    pronunciation: pronunciationHeader ? (raw[pronunciationHeader] ?? "").trim() : "",
    category: categoryHeader ? (raw[categoryHeader] ?? "").trim() : "",
    partOfSpeech: partOfSpeechHeader ? (raw[partOfSpeechHeader] ?? "").trim() : "",
    gender: genderHeader ? (raw[genderHeader] ?? "").trim() : "",
    synonyms: synonymsHeader
      ? (raw[synonymsHeader] ?? "")
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [],
    exampleFr: exampleFrHeader ? (raw[exampleFrHeader] ?? "").trim() : "",
    exampleEn: exampleEnHeader ? (raw[exampleEnHeader] ?? "").trim() : "",
    commonMistake: commonMistakeHeader ? (raw[commonMistakeHeader] ?? "").trim() : "",
    translations: languageColumns
      .map((lc) => ({ languageCode: lc.code, text: (raw[lc.header] ?? "").trim() }))
      .filter((t) => t.text.length > 0),
  }));

  const rows = await validateRows(rawRows);
  const validRowCount = rows.filter((r) => r.errors.length === 0).length;

  return {
    rows,
    totalRows: rows.length,
    validRowCount,
    errorRowCount: rows.length - validRowCount,
    unrecognizedColumns,
  };
}

/** Re-validates client-supplied rows server-side — never trusts client-reported `errors`. */
export function revalidateImportRows(rows: RawImportRow[]): Promise<ImportRowResult[]> {
  return validateRows(rows);
}

/**
 * Builds the downloadable example CSV. Headers are built dynamically from
 * currently-enabled non-English languages (never hardcoded Nepali/Hindi
 * columns) — new languages automatically show up here with no code change.
 * Demonstrates every recognized column, including the optional ones, so an
 * admin copying this file as a template sees the full shape immediately.
 */
export async function buildExampleCsv(): Promise<string> {
  const languages = await prisma.language.findMany({
    where: { enabled: true, code: { not: "en" } },
    orderBy: { displayOrder: "asc" },
  });

  const DEMO_TRANSLATIONS: Record<string, Record<string, string>> = {
    ne: { Bonjour: "नमस्ते", Merci: "धन्यवाद", Pomme: "स्याउ" },
    hi: { Bonjour: "नमस्ते", Merci: "धन्यवाद", Pomme: "सेब" },
  };

  // Deliberately spans more than one category to demonstrate the optional
  // per-row Category column — a single file does not have to be all one topic.
  const examples: {
    french: string;
    english: string;
    pronunciation: string;
    category: string;
    partOfSpeech: string;
    gender: string;
    synonyms: string;
    exampleFr: string;
    exampleEn: string;
    commonMistake: string;
  }[] = [
    {
      french: "Bonjour",
      english: "Hello / Good morning",
      pronunciation: "/bɔ̃.ʒuʁ/",
      category: "Greetings",
      partOfSpeech: "expression",
      gender: "",
      synonyms: "Salut",
      exampleFr: "Bonjour, comment allez-vous ?",
      exampleEn: "Hello, how are you?",
      commonMistake: "Don't use late in the evening — switch to Bonsoir.",
    },
    {
      french: "Merci",
      english: "Thank you",
      pronunciation: "/mɛʁ.si/",
      category: "Greetings",
      partOfSpeech: "expression",
      gender: "",
      synonyms: "",
      exampleFr: "Merci beaucoup !",
      exampleEn: "Thank you very much!",
      commonMistake: "",
    },
    {
      french: "Pomme",
      english: "Apple",
      pronunciation: "/pɔm/",
      category: "Food & Dining",
      partOfSpeech: "noun",
      gender: "feminine",
      synonyms: "",
      exampleFr: "Je mange une pomme.",
      exampleEn: "I'm eating an apple.",
      commonMistake: "",
    },
  ];

  const headers = [
    "French",
    "English",
    ...languages.map((l) => l.name),
    "Pronunciation",
    "Category",
    "Part of Speech",
    "Gender",
    "Synonyms",
    "Example (French)",
    "Example (English)",
    "Common Mistake",
  ];
  const data = examples.map((ex) => {
    const row: Record<string, string> = { French: ex.french, English: ex.english };
    for (const lang of languages) {
      row[lang.name] = DEMO_TRANSLATIONS[lang.code]?.[ex.french] ?? "";
    }
    row.Pronunciation = ex.pronunciation;
    row.Category = ex.category;
    row["Part of Speech"] = ex.partOfSpeech;
    row.Gender = ex.gender;
    row.Synonyms = ex.synonyms;
    row["Example (French)"] = ex.exampleFr;
    row["Example (English)"] = ex.exampleEn;
    row["Common Mistake"] = ex.commonMistake;
    return headers.map((h) => row[h] ?? "");
  });

  return Papa.unparse({ fields: headers, data });
}

/**
 * Streams all non-deleted vocabulary as CSV. Columns are driven by
 * whichever non-English languages actually have at least one translation
 * among the exported words, so the file isn't padded with empty columns
 * for languages nobody has translated into yet. Includes every field the
 * importer recognizes, so export → re-import round-trips losslessly.
 */
export async function buildExportCsv(): Promise<string> {
  const words = await prisma.vocabularyWord.findMany({
    where: { deletedAt: null },
    include: { translations: true },
    orderBy: [{ level: "asc" }, { unitTitle: "asc" }, { french: "asc" }],
  });

  const languageCodesPresent = new Set<string>();
  for (const word of words) {
    for (const translation of word.translations) {
      if (translation.languageCode !== "en") languageCodesPresent.add(translation.languageCode);
    }
  }

  const languages = await prisma.language.findMany({
    where: { code: { in: Array.from(languageCodesPresent) } },
    orderBy: { displayOrder: "asc" },
  });

  const headers = [
    "French",
    "English",
    ...languages.map((l) => l.name),
    "Pronunciation",
    "Category",
    "Part of Speech",
    "Gender",
    "Synonyms",
    "Example (French)",
    "Example (English)",
    "Common Mistake",
  ];

  const data = words.map((word) => {
    const english = word.translations.find((t) => t.languageCode === "en")?.translatedText ?? "";
    const row: Record<string, string> = { French: word.french, English: english };
    for (const lang of languages) {
      row[lang.name] = word.translations.find((t) => t.languageCode === lang.code)?.translatedText ?? "";
    }
    row.Pronunciation = word.pronunciationIpa;
    row.Category = word.unitTitle;
    row["Part of Speech"] = word.partOfSpeech;
    row.Gender = word.gender ?? "";
    row.Synonyms = word.synonyms.join("; ");
    row["Example (French)"] = word.exampleFr;
    row["Example (English)"] = word.exampleEn;
    row["Common Mistake"] = word.commonMistake ?? "";
    return headers.map((h) => row[h] ?? "");
  });

  return Papa.unparse({ fields: headers, data });
}
