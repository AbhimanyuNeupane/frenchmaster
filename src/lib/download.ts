import { ApiRequestError } from "@/lib/api-client";

/** Triggers a browser download for an in-memory Blob via a transient anchor. */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so the click has definitely been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Parses a `filename` out of a `Content-Disposition` header, falling back if absent. */
export function filenameFromContentDisposition(
  header: string | null,
  fallback: string
): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  return match ? decodeURIComponent(match[1].replace(/"/g, "").trim()) : fallback;
}

/**
 * Downloads an admin-only file (CSV export / import example) that lives behind
 * an authenticated route. These can't go through a plain `<a href>` (no auth
 * header) nor through `authedFetch` (which JSON-parses the body). Instead we
 * fetch the raw Response with the auth header + refresh-retry (`authedFetchRaw`
 * from AuthContext), then stream the blob to a browser download. A non-OK
 * response is decoded as the standard error envelope and surfaced as an
 * `ApiRequestError`, matching the rest of the app's error handling.
 */
export async function downloadAuthedFile(
  authedFetchRaw: (path: string, options?: RequestInit) => Promise<Response>,
  path: string,
  fallbackFilename: string
): Promise<void> {
  const res = await authedFetchRaw(path);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiRequestError(body?.error ?? `Download failed (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const filename = filenameFromContentDisposition(
    res.headers.get("Content-Disposition"),
    fallbackFilename
  );
  triggerBlobDownload(blob, filename);
}
