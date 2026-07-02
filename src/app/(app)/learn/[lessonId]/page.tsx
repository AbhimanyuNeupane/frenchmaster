"use client";

import { use } from "react";

import { PageError, PageLoading } from "@/components/layout/page-state";
import { LessonPlayer } from "@/components/learn/lesson-player";
import { useApiQuery } from "@/hooks/use-api-query";
import type { LessonContent } from "@/types/lesson";

export default function LessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const { data, isLoading, error, refetch } = useApiQuery<LessonContent>(
    `/api/lessons/${lessonId}`,
    [lessonId]
  );

  if (isLoading) return <PageLoading />;
  if (error || !data) return <PageError message={error ?? "No data returned."} onRetry={refetch} />;

  return <LessonPlayer lesson={data} />;
}
