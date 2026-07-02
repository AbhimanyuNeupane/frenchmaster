"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { attachPersistence } from "@/lesson-engine/persistence";

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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
