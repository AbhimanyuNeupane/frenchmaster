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

async function parseResponse<T>(res: Response): Promise<T> {
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
  return parseResponse<T>(res);
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
  return parseResponse<T>(res);
}
