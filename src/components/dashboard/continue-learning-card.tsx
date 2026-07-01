import Link from "next/link";
import { Clock, Play } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { LessonSummary } from "@/types";

export function ContinueLearningCard({ lesson }: { lesson: LessonSummary }) {
  return (
    <Card className="relative overflow-hidden border-none bg-navy p-6 text-white sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-navy-light/60 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 right-10 size-52 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {lesson.unitTitle}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
            <Clock className="size-3.5" />
            {lesson.estimatedMinutes} min
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {lesson.title}
          </h2>
          <p className="mt-1 text-sm text-white/70">{lesson.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-white/70">
            <span>Lesson progress</span>
            <span>{lesson.progress}%</span>
          </div>
          <Progress
            value={lesson.progress}
            className="bg-white/15"
            indicatorClassName="bg-accent"
          />
        </div>

        <Button variant="accent" size="lg" className="w-fit" asChild>
          <Link href="/learn">
            <Play className="size-4 fill-current" />
            Continue Learning
          </Link>
        </Button>
      </div>
    </Card>
  );
}
