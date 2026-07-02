"use client";

import { Progress } from "@/components/ui/progress";

export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <Progress value={percent} aria-label={label ?? "Lesson progress"} />
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
