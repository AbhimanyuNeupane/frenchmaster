"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Badge } from "@/components/ui/badge";
import { LessonCard } from "@/components/learn/lesson-card";
import type { CEFRLevel } from "@/types";
import type { CourseMapUnit } from "@/types/lesson";

const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
const LEVEL_LABEL: Record<CEFRLevel, string> = {
  A1: "A1 · Beginner",
  A2: "A2 · Elementary",
  B1: "B1 · Intermediate",
  B2: "B2 · Upper Intermediate",
};

export function CourseMap({ units }: { units: CourseMapUnit[] }) {
  // Group units by CEFR level, preserving level order then unit order.
  const levels = useMemo(() => {
    const byLevel = new Map<CEFRLevel, CourseMapUnit[]>();
    for (const unit of units) {
      const list = byLevel.get(unit.level) ?? [];
      list.push(unit);
      byLevel.set(unit.level, list);
    }
    return LEVEL_ORDER.filter((level) => byLevel.has(level)).map((level) => ({
      level,
      units: [...(byLevel.get(level) ?? [])].sort((a, b) => a.order - b.order),
    }));
  }, [units]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Learn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your French course, from A1 to B2. Pick up where you left off or start something new.
          </p>
        </div>
      </Reveal>

      {levels.length === 0 ? (
        <Reveal delay={0.05}>
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-navy">No lessons available yet</p>
            <p className="text-xs text-muted-foreground">
              Your course content is being prepared. Check back soon.
            </p>
          </div>
        </Reveal>
      ) : (
        levels.map((group, groupIndex) => (
          <Reveal key={group.level} delay={0.05 + groupIndex * 0.05}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Badge variant="accent" className="text-sm">
                  {group.level}
                </Badge>
                <h2 className="text-lg font-bold tracking-tight text-navy">
                  {LEVEL_LABEL[group.level]}
                </h2>
              </div>

              {group.units.map((unit) => (
                <div key={unit.id} className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-navy">{unit.title}</h3>
                    {unit.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{unit.description}</p>
                    )}
                  </div>

                  {unit.lessons.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[...unit.lessons]
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => (
                          <LessonCard key={lesson.id} lesson={lesson} />
                        ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                      Lessons for this unit are coming soon.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        ))
      )}
    </div>
  );
}
