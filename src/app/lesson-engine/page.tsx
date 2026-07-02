"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLessonList } from "@/lesson-engine/hooks";
import type { LessonSummary } from "@/lesson-engine/types";

// Display labels live in the HOST app, never in the engine. The engine treats
// language purely as an opaque string from the lesson JSON.
const LANGUAGE_LABEL: Record<string, string> = {
  fr: "French",
  es: "Spanish",
};

export default function LessonEnginePickerPage() {
  const { data: lessons, isLoading } = useLessonList();

  const grouped = React.useMemo(() => {
    const map = new Map<string, LessonSummary[]>();
    for (const l of lessons ?? []) {
      const list = map.get(l.language) ?? [];
      list.push(l);
      map.set(l.language, list);
    }
    return [...map.entries()];
  }, [lessons]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Choose a lesson
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          The same engine renders every lesson below. French and Spanish flow
          through identical UI and code — the only difference is the JSON.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(([language, items]) => (
            <section key={language} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                {LANGUAGE_LABEL[language] ?? language.toUpperCase()}
                <Badge variant="outline">{language}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((lesson) => (
                  <Link key={lesson.id} href={`/lesson-engine/${lesson.id}`}>
                    <Card className="group h-full transition-shadow hover:shadow-md">
                      <CardContent className="flex h-full flex-col gap-3 p-5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                            <BookOpen className="h-5 w-5" />
                          </span>
                          <Badge variant="accent">{lesson.level}</Badge>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="font-semibold text-foreground">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2 text-sm text-muted-foreground">
                          <span>{lesson.cardCount ?? "—"} cards</span>
                          <span className="inline-flex items-center gap-1 font-medium text-accent">
                            Start
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
