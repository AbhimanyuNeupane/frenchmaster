"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { apiAuthed, apiAuthedRaw, apiPublic, ApiRequestError } from "@/lib/api-client";
import type { AuthResponse, AuthUser } from "@/types/auth";

const REFRESH_TOKEN_KEY = "fm_refresh_token";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    primaryLanguage?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  /** Authenticated fetch that transparently refreshes the access token once on 401. */
  authedFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
  /**
   * Like {@link authedFetch} but returns the raw Response (same 401
   * refresh-retry). For FormData uploads and binary downloads that can't go
   * through the JSON-decoding path.
   */
  authedFetchRaw: (path: string, options?: RequestInit) => Promise<Response>;
  /**
   * Updates the signed-in user's primary language (PATCH /api/auth/me),
   * optimistically updating local state and rolling back on failure.
   */
  updatePrimaryLanguage: (languageCode: string) => Promise<void>;
  /**
   * Returns the current in-memory access token (or `null` when signed out).
   * A stable function that reads `accessTokenRef` directly, so it's always
   * fresh with no stale-closure risk — mirrors how `authedFetch` reads the ref
   * internally. Consumed by the self-contained lesson-engine (via its injected
   * token provider) so its public read API can be auth-aware without importing
   * AuthContext.
   */
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Access token lives in memory only — never persisted — to limit exposure
  // if an XSS vector ever reads localStorage. Only the refresh token (which
  // is single-use and rotated on every refresh) is persisted.
  const accessTokenRef = useRef<string | null>(null);

  const applySession = useCallback((session: AuthResponse) => {
    accessTokenRef.current = session.accessToken;
    setUser(session.user);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return null;

    try {
      const session = await apiPublic<AuthResponse>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      applySession(session);
      return session.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
    // Restore the session once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await apiPublic<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      applySession(session);
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string, primaryLanguage?: string) => {
      const session = await apiPublic<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name,
          // Omit entirely when unset so the backend applies its "en" default.
          ...(primaryLanguage ? { primaryLanguage } : {}),
        }),
      });
      applySession(session);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    clearSession();
    if (storedRefreshToken) {
      await apiPublic("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      }).catch(() => {
        // Best-effort server-side revocation — local session is already cleared.
      });
    }
  }, [clearSession]);

  const authedFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      let token = accessTokenRef.current;
      if (!token) {
        token = await refresh();
      }
      if (!token) {
        throw new ApiRequestError("Not authenticated", 401);
      }

      try {
        return await apiAuthed<T>(path, token, options);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          const refreshed = await refresh();
          if (refreshed) {
            return apiAuthed<T>(path, refreshed, options);
          }
        }
        throw err;
      }
    },
    [refresh]
  );

  const authedFetchRaw = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      let token = accessTokenRef.current;
      if (!token) {
        token = await refresh();
      }
      if (!token) {
        throw new ApiRequestError("Not authenticated", 401);
      }

      let res = await apiAuthedRaw(path, token, options);
      if (res.status === 401) {
        const refreshed = await refresh();
        if (refreshed) {
          res = await apiAuthedRaw(path, refreshed, options);
        }
      }
      return res;
    },
    [refresh]
  );

  const updatePrimaryLanguage = useCallback(
    async (languageCode: string) => {
      const previous = user;
      // Optimistic: reflect immediately so vocabulary/lesson native
      // translations re-resolve without waiting on the round-trip.
      setUser((prev) => (prev ? { ...prev, primaryLanguage: languageCode } : prev));
      try {
        const updated = await authedFetch<AuthUser>("/api/auth/me", {
          method: "PATCH",
          body: JSON.stringify({ primaryLanguage: languageCode }),
        });
        setUser(updated);
      } catch (err) {
        setUser(previous);
        throw err;
      }
    },
    [user, authedFetch]
  );

  // Stable getter reading the ref synchronously — always fresh, safe to register
  // once with the lesson-engine's token provider without re-registering on token
  // changes.
  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      authedFetch,
      authedFetchRaw,
      updatePrimaryLanguage,
      getAccessToken,
    }),
    [user, isLoading, login, register, logout, authedFetch, authedFetchRaw, updatePrimaryLanguage, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
