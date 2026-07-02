import type { CEFRLevel } from "@/types";

export type UserRole = "ADMIN" | "MODERATOR" | "PREMIUM" | "USER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  currentLevel: CEFRLevel;
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
