import type { CEFRLevel } from "@/types";

/**
 * A Role.id slug (e.g. "administrator", "student") — dynamic, admin-managed
 * data (see GET /api/admin/roles), never a fixed set of literals. Kept as a
 * named type (rather than inlining `string` everywhere) so call sites read
 * as "this is a role", not an arbitrary string.
 */
export type UserRole = string;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  /** The role's granted permission keys, fetched fresh at login/refresh — see RequirePermission. */
  permissions: string[];
  currentLevel: CEFRLevel;
  /** Language code of the user's preferred display language (defaults to "en"). */
  primaryLanguage: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
