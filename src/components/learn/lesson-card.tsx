import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Play, RotateCcw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CourseMapLesson } from "@/types/lesson";

/** Derives the call-to-action state from a lesson's progress. */
function lessonState(progress: number) {
  if (progress >= 100) {
    return { label: "Review", icon: RotateCcw, badgeVariant: "success" as const, badgeLabel: "Completed" };
  }
  if (progress > 0) {
    return { label: "Continue", icon: Play, badgeVariant: "warning" as const, badgeLabel: "In progress" };
  }
  return { label: "Start", icon: Play, badgeVariant: "outline" as const, badgeLabel: "Not started" };
}

export function LessonCard({ lesson }: { lesson: CourseMapLesson }) {
  const state = lessonState(lesson.progress);
  const StateIcon = state.icon;

  return (
    <Link
      href={`/learn/${lesson.id}`}
      className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="group flex h-full flex-col gap-4 p-5 transition-colors hover:border-accent/40">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={state.badgeVariant}>
            {lesson.progress >= 100 && <CheckCircle2 className="size-3.5" />}
            {state.badgeLabel}
          </Badge>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" />
            {lesson.estimatedMinutes} min
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-navy">{lesson.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{lesson.subtitle}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span>{lesson.progress}%</span>
            </div>
            <Progress value={lesson.progress} />
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            <StateIcon className="size-4" />
            {state.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
