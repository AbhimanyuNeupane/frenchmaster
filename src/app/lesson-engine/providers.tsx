"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { attachPersistence } from "@/lesson-engine/persistence";
import { setAuthTokenProvider } from "@/lesson-engine/services/auth/tokenProvider";
import { useAuth } from "@/contexts/auth-context";

/**
 * Registers the host app's access-token getter with the engine's token provider,
 * once on mount. This is the host-side half of the auth seam: the engine stays
 * self-contained (it never imports AuthContext), while the app supplies the real
 * token here. `AuthProvider` wraps the ENTIRE app at the root layout, so
 * `useAuth()` works even though this route sits outside the `(app)` auth-required
 * group — anonymous visitors simply get `getAccessToken() => null` (no token
 * sent, backend treats them as anonymous, they see only free content). We
 * deliberately do NOT gate this route behind auth.
 *
 * Known, accepted limitation: if the access token expires (15min TTL) while the
 * learner stays on this route, the engine won't proactively refresh it (that
 * would require importing more of AuthContext than the single getter). The
 * backend's `optionalAuth` degrades an expired/invalid token to anonymous
 * gracefully, so gated content just reads as locked until the token is refreshed
 * elsewhere (e.g. next full page load) — not a crash.
 */
function AuthTokenBridge() {
  const { getAccessToken } = useAuth();
  React.useEffect(() => {
    setAuthTokenProvider(getAccessToken);
  }, [getAccessToken]);
  return null;
}

/**
 * Locally-scoped providers for the lesson-engine demo route. The React Query
 * client lives HERE, not in the root layout, so the engine's data layer stays
 * self-contained. Persistence is wired once here (opt-in) — the engine works
 * without it.
 */
export function LessonEngineProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
      })
  );

  React.useEffect(() => {
    const detach = attachPersistence();
    return detach;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthTokenBridge />
      {children}
    </QueryClientProvider>
  );
}
