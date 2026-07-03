"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentProvider } from "../services/content";
import type { Course, CourseSummary, LessonSummary } from "../types";

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

/** Lists published course summaries, optionally filtered by language/level.
 *  Drives the public picker's course-first layout. Same pattern as
 *  {@link useLessonList}. */
export function useCourseList(filter: { language?: string; level?: string } = {}) {
  return useQuery<CourseSummary[]>({
    queryKey: ["lesson-engine", "courses", filter],
    queryFn: () => getContentProvider().listCourses(filter),
    retry: false,
  });
}
