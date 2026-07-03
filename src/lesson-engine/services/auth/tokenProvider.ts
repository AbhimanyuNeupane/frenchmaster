/**
 * Auth-token seam for the lesson-engine's HTTP layer.
 *
 * The engine is self-contained: it never imports from the rest of the
 * FrenchMaster app (`src/contexts/auth-context.tsx`, `src/lib/**`) so it stays
 * portable to a future mobile/standalone build (a hard architectural rule — see
 * ARCHITECTURE.md). But the public read API is auth-*aware*: when a valid bearer
 * token is present the backend computes per-user `locked`/gating state.
 *
 * Rather than importing AuthContext directly, the host injects a token getter —
 * the same dependency-injection pattern the module already uses to swap content/
 * media/persistence providers. The host calls `setAuthTokenProvider(getter)`
 * once on mount; `httpClient` calls `getAuthToken()` per request. When no host
 * registers a getter (or the visitor is anonymous) this returns `null` and the
 * backend treats the request as anonymous — free content only.
 */
type TokenGetter = () => string | null;

let getToken: TokenGetter = () => null;

/** Host wiring point. Registers the function used to read the current access token. */
export function setAuthTokenProvider(fn: TokenGetter): void {
  getToken = fn;
}

/** Read the current access token, or `null` when anonymous / unwired. */
export function getAuthToken(): string | null {
  return getToken();
}
