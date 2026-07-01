import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UpcomingExam } from "@/types";

export function UpcomingExamCard({ exam }: { exam: UpcomingExam }) {
  const readyPct = Math.round((exam.sectionsReady / exam.sectionsTotal) * 100);
  const date = new Date(exam.availableFrom).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
          <GraduationCap className="size-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">{exam.title}</p>
          <p className="text-xs text-muted-foreground">Available from {date}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Preparation</span>
          <span>
            {exam.sectionsReady}/{exam.sectionsTotal} sections ready
          </span>
        </div>
        <Progress value={readyPct} className="h-2" />
      </div>

      <Button variant="outline" className="w-full" asChild>
        <Link href="/exam">View Exam Details</Link>
      </Button>
    </Card>
  );
}
