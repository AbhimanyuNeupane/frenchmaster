/**
 * Tiny, dependency-free HTTP client for the lesson-engine's own read API.
 *
 * This module is deliberately self-contained: the engine never imports from the
 * rest of the FrenchMaster app (`src/lib/api-client.ts` etc.) so it stays
 * portable to a future mobile/standalone build. That portability is a hard
 * architectural constraint (see ARCHITECTURE.md), so we duplicate the ~15 lines
 * of envelope-unwrapping here rather than reach across the boundary.
 *
 * It only unwraps the standard `{ success, data }` / `{ success: false, error }`
 * envelope the Express backend returns — identical semantics to the app-wide
 * `parseApiResponse`, kept in sync by shape, not by import.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

interface ApiFailure {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * GETs `path` against the backend and returns the unwrapped `data` payload.
 * Throws a plain `Error` (with the server's message) on a transport error or a
 * `success: false` body — the callers (ApiContentProvider) translate that into
 * a typed `LessonLoadError`.
 */
export async function httpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });

  const body = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!res.ok || !body || body.success === false) {
    const message =
      body && "error" in body ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body.data;
}
