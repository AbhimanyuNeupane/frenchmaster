import type { CEFRLevel, PartOfSpeech, WordGender } from "@/types";
import type { UserRole } from "@/types/auth";

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
  english: string;
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
  english: string;
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
