"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PageError } from "@/components/layout/page-state";
import { CourseEditor } from "@/components/admin/lesson-engine/course-editor";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AdminLessonEngineCourseDetail } from "@/types/lessonEngineAdmin";

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, error, refetch } =
    useApiQuery<AdminLessonEngineCourseDetail>(
      `/api/admin/lesson-engine/courses/${id}`,
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

  return <CourseEditor course={data} />;
}
