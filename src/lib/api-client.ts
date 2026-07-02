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

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Reads the standard `{ success, data }` envelope from a Response, throwing
 * `ApiRequestError` on a transport error or `success: false` body. Exported
 * so callers that obtain a raw Response themselves (e.g. FormData uploads via
 * {@link apiAuthedRaw}) can decode it the same way as the JSON helpers.
 */
export async function parseApiResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!res.ok || !body || body.success === false) {
    const message = body && "error" in body ? body.error : `Request failed (${res.status})`;
    throw new ApiRequestError(message, res.status, body && "details" in body ? body.details : undefined);
  }

  return body.data;
}

/**
 * Bare fetch against the backend, no auth. Used for register/login/refresh.
 */
export async function apiPublic<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return parseApiResponse<T>(res);
}

/**
 * Authenticated fetch. Callers pass the current access token; on a 401 the
 * caller is responsible for refreshing and retrying (see AuthContext),
 * since only it knows the refresh token and how to persist a new one.
 */
export async function apiAuthed<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  return parseApiResponse<T>(res);
}

/**
 * Authenticated fetch that returns the raw {@link Response} without decoding
 * the JSON envelope. Needed for the two cases the JSON helpers can't handle:
 *   - `multipart/form-data` uploads (must NOT set a `Content-Type` header, so
 *     the browser can add the multipart boundary — hence no default here),
 *   - binary downloads (CSV export / import example) read via `res.blob()`.
 * Like {@link apiAuthed}, the caller owns 401 refresh-and-retry — see
 * `authedFetchRaw` in AuthContext, which layers that on top.
 */
export async function apiAuthedRaw(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}
