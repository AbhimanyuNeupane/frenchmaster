"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LessonRenderer } from "@/lesson-engine/engine";
import type { Lesson } from "@/lesson-engine/types";

/**
 * Wraps the engine's `LessonRenderer` in a locally-scoped React Query client so
 * a draft can be previewed inside the admin panel. The client lives HERE (not in
 * any admin/root layout) so the engine's data layer stays self-contained and we
 * don't leak a `QueryClientProvider` into layouts that don't need one — mirrors
 * `src/app/lesson-engine/providers.tsx`. `LessonRenderer` never fetches in
 * preview mode, but React Query still requires a provider ancestor for its
 * (disabled) query hook, hence this thin wrapper.
 */
export function LessonPreviewPanel({ lesson }: { lesson: Lesson }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: false },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LessonRenderer previewLesson={lesson} />
    </QueryClientProvider>
  );
}
