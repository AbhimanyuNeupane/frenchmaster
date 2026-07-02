"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentProvider } from "../services/content";
import type { Course, LessonSummary } from "../types";

export function useCourse(courseId: string | undefined) {
  return useQuery<Course>({
    queryKey: ["lesson-engine", "course", courseId],
    enabled: Boolean(courseId),
    queryFn: () => getContentProvider().getCourse(courseId as string),
    retry: false,
  });
}

/** Lists lesson summaries, optionally filtered by language/level. Drives the
 *  demo picker so both fr/A1 and es/A1 render through the identical UI. */
export function useLessonList(filter: { language?: string; level?: string } = {}) {
  return useQuery<LessonSummary[]>({
    queryKey: ["lesson-engine", "lessons", filter],
    queryFn: () => getContentProvider().listLessons(filter),
    retry: false,
  });
}
