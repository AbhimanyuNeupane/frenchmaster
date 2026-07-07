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
 *
 * Auth-awareness: the public read API is login-*aware*, not login-*required*.
 * When the host has registered an access-token getter (see
 * services/auth/tokenProvider.ts) and it returns a non-null token, we attach an
 * `Authorization: Bearer <token>` header so the backend can compute per-user
 * `locked`/gating state. With no token, the request is anonymous and the backend
 * serves only fully-public content. The token is pulled through the injected
 * getter — NOT an import from `src/contexts` — preserving self-containment.
 */

import { getAuthToken } from "../auth/tokenProvider";

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
 * Transport/HTTP-level failure carrying the response `status` and the failure
 * envelope's `details` so callers can distinguish, e.g., a 403 gated-content
 * response (details include `requiredPermissionKey`) from a 404/500. Kept
 * local to the engine — the ApiContentProvider translates it into a typed
 * `LessonLoadError`.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

/**
 * GETs `path` against the backend and returns the unwrapped `data` payload.
 * Attaches a bearer token when the host has provided one. Throws an `HttpError`
 * (carrying status + `details`) on a transport error or a `success: false`
 * body — callers (ApiContentProvider) translate that into a typed
 * `LessonLoadError`.
 */
export async function httpGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers });

  const body = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!res.ok || !body || body.success === false) {
    const message =
      body && "error" in body ? body.error : `Request failed (${res.status})`;
    const details = body && "details" in body ? body.details : undefined;
    throw new HttpError(message, res.status, details);
  }

  return body.data;
}
