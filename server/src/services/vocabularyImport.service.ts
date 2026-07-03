import Papa from "papaparse";
import { prisma } from "../config/prisma";
import { adminRepository, type TranslationEntryInput } from "../repositories/admin.repository";

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
  translations: TranslationEntryInput[];
}

/**
 * Validates a batch of already-structured rows: missing French, missing
 * English, empty pronunciation (required — VocabularyWord.pronunciationIpa
 * is a non-null DB column), and duplicate vocabulary (case-insensitive
 * French text, either repeated earlier in the same batch or already
 * present in the live catalog). Duplicate-against-DB is checked with a
 * single findMany, never N+1.
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
    const errors: string[] = [];

    if (!french) errors.push("Missing French text");
    if (!english) errors.push("Missing English translation");
    if (!pronunciation) errors.push("Empty pronunciation");

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
      data: { french, english, pronunciation, category: raw.category.trim(), translations: raw.translations },
      errors,
    };
  });
}

/**
 * Parses + validates an uploaded CSV buffer. Expected columns
 * (case-insensitive, trimmed): French (required), English (required),
 * Pronunciation (optional), Category/Unit (optional — see below), plus any
 * column whose header matches an existing Language.name (case-insensitively)
 * — those become per-row `translations` entries. Any other header is
 * reported as an unrecognized column (a warning, not a per-row error).
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
  const languageColumns: { header: string; code: string }[] = [];
  const unrecognizedColumns: string[] = [];

  for (const header of headers) {
    const normalized = header.trim().toLowerCase();
    if (normalized === "french") frenchHeader = header;
    else if (normalized === "english") englishHeader = header;
    else if (normalized === "pronunciation") pronunciationHeader = header;
    else if (normalized === "category" || normalized === "unit" || normalized === "unittitle") {
      categoryHeader = header;
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
 * Falls back to an empty cell for any enabled language this hardcoded demo
 * set doesn't have a plausible translation for.
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
  const examples: { french: string; english: string; pronunciation: string; category: string }[] = [
    { french: "Bonjour", english: "Hello / Good morning", pronunciation: "/bɔ̃.ʒuʁ/", category: "Greetings" },
    { french: "Merci", english: "Thank you", pronunciation: "/mɛʁ.si/", category: "Greetings" },
    { french: "Pomme", english: "Apple", pronunciation: "/pɔm/", category: "Food & Dining" },
  ];

  const headers = ["French", "English", ...languages.map((l) => l.name), "Pronunciation", "Category"];
  const data = examples.map((ex) => {
    const row: Record<string, string> = { French: ex.french, English: ex.english };
    for (const lang of languages) {
      row[lang.name] = DEMO_TRANSLATIONS[lang.code]?.[ex.french] ?? "";
    }
    row.Pronunciation = ex.pronunciation;
    row.Category = ex.category;
    return headers.map((h) => row[h] ?? "");
  });

  return Papa.unparse({ fields: headers, data });
}

/**
 * Streams all non-deleted vocabulary as CSV. Columns are driven by
 * whichever non-English languages actually have at least one translation
 * among the exported words, so the file isn't padded with empty columns
 * for languages nobody has translated into yet.
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

  const headers = ["French", "English", ...languages.map((l) => l.name), "Pronunciation", "Category"];

  const data = words.map((word) => {
    const english = word.translations.find((t) => t.languageCode === "en")?.translatedText ?? "";
    const row: Record<string, string> = { French: word.french, English: english };
    for (const lang of languages) {
      row[lang.name] = word.translations.find((t) => t.languageCode === lang.code)?.translatedText ?? "";
    }
    row.Pronunciation = word.pronunciationIpa;
    row.Category = word.unitTitle;
    return headers.map((h) => row[h] ?? "");
  });

  return Papa.unparse({ fields: headers, data });
}
