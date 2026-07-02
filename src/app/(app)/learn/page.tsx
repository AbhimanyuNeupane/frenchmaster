"use client";

import { PageError, PageLoading } from "@/components/layout/page-state";
import { CourseMap } from "@/components/learn/course-map";
import { useApiQuery } from "@/hooks/use-api-query";
import type { CourseMapUnit } from "@/types/lesson";

export default function LearnPage() {
  const { data, isLoading, error, refetch } =
    useApiQuery<CourseMapUnit[]>("/api/lessons/units");

  if (isLoading) return <PageLoading />;
  if (error || !data) return <PageError message={error ?? "No data returned."} onRetry={refetch} />;

  return <CourseMap units={data} />;
}
