"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Loader2, Lock } from "lucide-react";
import { useQueries } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourseList, useLessonList } from "@/lesson-engine/hooks";
import { getContentProvider } from "@/lesson-engine/services/content";
import type { Course, LessonSummary } from "@/lesson-engine/types";

// Display labels live in the HOST app, never in the engine. The engine treats
// language purely as an opaque string from the lesson/course JSON — this map
// only reflects the languages actually published today (French only, per
// CLAUDE.md's "Current Content Scope"); adding a language later is purely a
// data change plus a label here, no engine change.
const LANGUAGE_LABEL: Record<string, string> = {
  fr: "French",
};

function languageLabel(code: string): string {
  return LANGUAGE_LABEL[code] ?? code.toUpperCase();
}

export default function LessonEnginePickerPage() {
  const { data: courses, isLoading: coursesLoading } = useCourseList();
  const { data: allLessons, isLoading: lessonsLoading } = useLessonList();

  // Load each published course's full section/lesson tree in parallel. Doing it
  // at the page level (rather than per-course-block) gives us the aggregated set
  // of course-covered lesson ids we need for the "Other lessons" fallback below.
  const courseDetailQueries = useQueries({
    queries: (courses ?? []).map((c) => ({
      queryKey: ["lesson-engine", "course", c.id],
      queryFn: () => getContentProvider().getCourse(c.id),
      retry: false,
    })),
  });

  const loadedCourses = React.useMemo(
    () =>
      courseDetailQueries
        .map((q) => q.data)
        .filter((c): c is Course => Boolean(c)),
    [courseDetailQueries]
  );

  // Set of every lesson id that appears in any loaded course's sections — used
  // to keep unassigned lessons discoverable under "Other lessons" rather than
  // letting them vanish from the picker entirely.
  const coveredLessonIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const course of loadedCourses) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) ids.add(lesson.id);
      }
    }
    return ids;
  }, [loadedCourses]);

  const otherLessons = React.useMemo(
    () => (allLessons ?? []).filter((l) => !coveredLessonIds.has(l.id)),
    [allLessons, coveredLessonIds]
  );

  const isLoading = coursesLoading || lessonsLoading;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Courses
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Structured French courses, organized into sections and lessons.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {(courses ?? []).map((summary, i) => {
            const detail = courseDetailQueries[i]?.data;
            const loadingDetail = courseDetailQueries[i]?.isLoading ?? false;
            return (
              <CourseBlock
                key={summary.id}
                title={summary.title}
                description={summary.description}
                language={summary.language}
                level={summary.level}
                course={detail}
                loading={loadingDetail}
              />
            );
          })}

          {otherLessons.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Other lessons
                </h2>
                <p className="text-sm text-muted-foreground">
                  Standalone lessons that aren&apos;t part of a course yet.
                </p>
              </div>
              <LessonGrid lessons={otherLessons} />
            </section>
          )}

          {(courses ?? []).length === 0 && otherLessons.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
              No published lessons or courses are available yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseBlock({
  title,
  description,
  language,
  level,
  course,
  loading,
}: {
  title: string;
  description?: string;
  language: string;
  level: string;
  course: Course | undefined;
  loading: boolean;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground">
          {title}
          <Badge variant="outline">{languageLabel(language)}</Badge>
          <Badge variant="accent">{level}</Badge>
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sections…
        </div>
      ) : !course ? (
        <p className="text-sm text-muted-foreground">
          This course couldn&apos;t be loaded right now.
        </p>
      ) : course.sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This course has no sections yet.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {course.sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h3>
              {section.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No lessons in this section yet.
                </p>
              ) : (
                <LessonGrid lessons={section.lessons} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LessonGrid({ lessons }: { lessons: LessonSummary[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lessons.map((lesson) => (
        <LessonPickCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}

function LessonPickCard({ lesson }: { lesson: LessonSummary }) {
  const locked = lesson.locked === true;

  return (
    // Locked cards stay navigable on purpose: clicking through surfaces a clear,
    // specific "requires an X account" message (from the player's 403 handling)
    // rather than nothing happening.
    <Link href={`/lesson-engine/${lesson.id}`}>
      <Card className="group h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <span
              className={
                "inline-flex h-9 w-9 items-center justify-center rounded-xl " +
                (locked
                  ? "bg-muted text-muted-foreground"
                  : "bg-accent/15 text-accent")
              }
            >
              {locked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
            </span>
            <Badge variant="accent">{lesson.level}</Badge>
            {locked && <Badge variant="outline">Locked</Badge>}
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-semibold text-foreground">{lesson.title}</h4>
            {lesson.description && (
              <p className="text-sm text-muted-foreground">
                {lesson.description}
              </p>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <span>{lesson.cardCount ?? "—"} cards</span>
            {locked ? (
              <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Requires access
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                Start
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
