"use client";

import { useParams, useRouter } from "next/navigation";
import { LessonRenderer } from "@/lesson-engine/engine";

export default function LessonPlayerPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params?.lessonId;

  if (!lessonId) return null;

  return (
    <LessonRenderer
      lessonId={lessonId}
      onExit={() => router.push("/lesson-engine")}
    />
  );
}
