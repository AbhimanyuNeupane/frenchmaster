import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { LessonSummary } from "@/types";

export function TodaysLessonCard({ lesson }: { lesson: LessonSummary }) {
  return (
    <Link href="/learn">
      <Card className="group flex items-center gap-4 p-5 transition-colors hover:border-accent/40">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Sparkles className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today&apos;s Lesson
          </p>
          <p className="truncate text-sm font-bold text-navy">{lesson.title}</p>
          <p className="truncate text-xs text-muted-foreground">{lesson.subtitle}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </Card>
    </Link>
  );
}
