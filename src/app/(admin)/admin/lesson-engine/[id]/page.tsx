"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PageError } from "@/components/layout/page-state";
import { LessonEditor } from "@/components/admin/lesson-engine/lesson-editor";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AdminLessonEngineLessonDetail } from "@/types/lessonEngineAdmin";

export default function EditLessonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, error, refetch } =
    useApiQuery<AdminLessonEngineLessonDetail>(
      `/api/admin/lesson-engine/lessons/${id}`,
      [id]
    );

  if (error) return <PageError message={error} onRetry={refetch} />;
  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
    );
  }

  return <LessonEditor lesson={data} />;
}
