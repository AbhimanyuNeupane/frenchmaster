import type { CEFRLevel, PartOfSpeech, WordGender } from "@/types";
import type { UserRole } from "@/types/auth";
import type { Translation } from "@/types/language";

/** Account moderation state — mirrors the backend `status` enum. */
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

/** Offset-based pagination envelope returned by the admin list endpoints. */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Admin-facing user projection from `GET /api/admin/users` (never includes passwordHash). */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  currentLevel: CEFRLevel;
  createdAt: string;
  // Present on the PATCH response, absent on the list response.
  updatedAt?: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: Pagination;
}

/** Shape accepted by `PATCH /api/admin/users/:id` — at least one field required by the server. */
export interface UpdateUserPayload {
  role?: UserRole;
  status?: UserStatus;
  currentLevel?: CEFRLevel;
}

/** Metrics from `GET /api/admin/analytics/overview`. */
export interface AnalyticsOverview {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  activeUsersLast7Days: number;
  vocabularyWordCount: number;
}

/** Full vocabulary record from the admin catalog endpoints. */
export interface AdminVocabularyWord {
  id: string;
  french: string;
  /**
   * Every translation authored for this word (all languages, not just the
   * viewer's) — must always include exactly one entry with languageCode "en".
   * Replaces the old flat `english` field.
   */
  translations: Translation[];
  gender: WordGender | null;
  partOfSpeech: PartOfSpeech;
  pronunciationIpa: string;
  audioUrl: string | null;
  exampleFr: string;
  exampleEn: string;
  imageUrl: string | null;
  synonyms: string[];
  commonMistake: string | null;
  level: CEFRLevel;
  unitTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVocabularyListResponse {
  words: AdminVocabularyWord[];
  pagination: Pagination;
}

/**
 * Body for creating/updating a vocabulary word. Matches
 * `createVocabularyWordSchema` on the backend; nullable fields are sent as
 * `null` (not empty strings) so they pass the server's `.url()` / enum checks.
 */
export interface VocabularyWordPayload {
  french: string;
  /** Must include exactly one entry with languageCode "en" and no duplicate codes. */
  translations: Translation[];
  gender: WordGender | null;
  partOfSpeech: PartOfSpeech;
  pronunciationIpa: string;
  audioUrl: string | null;
  exampleFr: string;
  exampleEn: string;
  imageUrl: string | null;
  synonyms: string[];
  commonMistake: string | null;
  level: CEFRLevel;
  unitTitle: string;
}

// --- Language management (POST/PATCH /api/admin/languages) ---

/** Body for `POST /api/admin/languages`. `code`/`isDefault` are immutable after creation. */
export interface CreateLanguagePayload {
  code: string;
  name: string;
  flagEmoji: string;
  displayOrder: number;
  enabled: boolean;
}

/** Body for `PATCH /api/admin/languages/:code` — only these fields are mutable. */
export interface UpdateLanguagePayload {
  name?: string;
  flagEmoji?: string;
  displayOrder?: number;
  enabled?: boolean;
}

// --- Vocabulary CSV import/export ---

/** The per-row `data` payload shared by the preview response and commit request. */
export interface ImportRowData {
  french: string;
  english: string;
  pronunciation: string;
  /** Per-row category override from an optional "Category"/"Unit" CSV column.
   *  Empty string means "no override" — commit falls back to the batch-level
   *  unitTitle, so a mixed-topic file is never forced into one category. */
  category: string;
  translations: Translation[];
}

/** One parsed CSV row with any per-row validation errors. */
export interface ImportRowResult {
  rowNumber: number;
  data: ImportRowData;
  errors: string[];
}

/** Response from `POST /api/admin/vocabulary/import/preview` (writes nothing). */
export interface ImportPreviewResponse {
  rows: ImportRowResult[];
  totalRows: number;
  validRowCount: number;
  errorRowCount: number;
  unrecognizedColumns: string[];
  /** Set when the file couldn't be parsed at all (bad encoding, missing required column). */
  fatalError?: string;
}

/** Body for `POST /api/admin/vocabulary/import/commit`. */
export interface ImportCommitPayload {
  rows: ImportRowData[];
  level: CEFRLevel;
  unitTitle: string;
}

/** Response from `POST /api/admin/vocabulary/import/commit`. */
export interface ImportCommitResponse {
  imported: number;
  skipped: number;
  errors: { rowNumber: number; errors: string[] }[];
}

// --- AI-assisted translation ---

/** Response from `GET /api/admin/vocabulary/ai-translate/status`. */
export interface AiTranslateStatus {
  /** False when the backend's ANTHROPIC_API_KEY isn't configured. */
  configured: boolean;
}

/**
 * Response from `POST /api/admin/vocabulary/:id/ai-translate` — suggestions
 * only; nothing is written to the database.
 */
export interface AiTranslateSuggestion {
  languageCode: string;
  text: string;
}

/**
 * Response from `POST /api/admin/vocabulary/ai-translate-bulk` — writes gap
 * translations directly (never overwrites an existing one).
 */
export interface AiTranslateBulkResponse {
  wordsProcessed: number;
  translationsAdded: number;
  errors: { wordId: string; error: string }[];
}
