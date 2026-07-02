"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentProvider } from "../services/content";
import type { Lesson } from "../types";

/** React Query wrapper around the content provider. Components never import a
 *  concrete provider — they call this hook, so the backend can be swapped in one
 *  place (services/content/index.ts). */
export function useLesson(lessonId: string | undefined) {
  return useQuery<Lesson>({
    queryKey: ["lesson-engine", "lesson", lessonId],
    enabled: Boolean(lessonId),
    queryFn: () => getContentProvider().getLesson(lessonId as string),
    retry: false,
  });
}
