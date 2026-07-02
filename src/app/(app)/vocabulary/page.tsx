"use client";

import { PageError, PageLoading } from "@/components/layout/page-state";
import { VocabularyExplorer } from "@/components/vocabulary/vocabulary-explorer";
import { useApiQuery } from "@/hooks/use-api-query";
import type { VocabularyListResponse } from "@/types";

export default function VocabularyPage() {
  const { data, isLoading, error, refetch } = useApiQuery<VocabularyListResponse>("/api/vocabulary");

  if (isLoading) return <PageLoading />;
  if (error || !data) return <PageError message={error ?? "No data returned."} onRetry={refetch} />;

  return <VocabularyExplorer initialData={data} />;
}
