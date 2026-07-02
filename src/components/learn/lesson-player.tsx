"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookText,
  Clock,
  GraduationCap,
  Headphones,
  Library,
  MessagesSquare,
  SpellCheck2,
} from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { LessonSection } from "@/components/learn/lesson-section";
import { LessonVocabulary } from "@/components/learn/lesson-vocabulary";
import { LessonGrammar } from "@/components/learn/lesson-grammar";
import { LessonDialogues } from "@/components/learn/lesson-dialogues";
import { LessonReading } from "@/components/learn/lesson-reading";
import { LessonListening } from "@/components/learn/lesson-listening";
import { LessonQuiz } from "@/components/learn/lesson-quiz";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LessonContent } from "@/types/lesson";

export function LessonPlayer({ lesson }: { lesson: LessonContent }) {
  const [progress, setProgress] = useState(lesson.progress);

  const hasVocabulary = lesson.vocabulary.length > 0;
  const hasGrammar = lesson.grammarPoints.length > 0;
  const hasDialogues = lesson.dialogues.length > 0;
  const hasReading = lesson.readingPassages.length > 0;
  const hasListening = lesson.listeningClips.length > 0;
  const hasExercises = lesson.exercises.length > 0;

  const isEmpty =
    !hasVocabulary && !hasGrammar && !hasDialogues && !hasReading && !hasListening && !hasExercises;

  // Stagger the section entrance animations as they appear down the page.
  let step = 0;
  const nextDelay = () => 0.05 + step++ * 0.05;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <Reveal>
        <div className="flex flex-col gap-5">
          <Link
            href="/learn"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
          >
            <ArrowLeft className="size-4" />
            Back to Learn
          </Link>

          <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-navy-light/60 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 right-10 size-52 rounded-full bg-accent/20 blur-3xl"
            />
            <div className="relative flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{lesson.level}</Badge>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  {lesson.unit.title}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                  <Clock className="size-3.5" />
                  {lesson.estimatedMinutes} min
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
                <p className="mt-1 text-sm text-white/70">{lesson.subtitle}</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-medium text-white/70">
                  <span>Lesson progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="bg-white/15" indicatorClassName="bg-accent" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {isEmpty && (
        <Reveal delay={0.05}>
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <BookText className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-navy">This lesson has no content yet</p>
            <p className="text-xs text-muted-foreground">Check back once it&apos;s been published.</p>
          </div>
        </Reveal>
      )}

      {hasVocabulary && (
        <Reveal delay={nextDelay()}>
          <LessonSection icon={Library} title="Vocabulary" description="Key words for this lesson">
            <LessonVocabulary words={lesson.vocabulary} />
          </LessonSection>
        </Reveal>
      )}

      {hasGrammar && (
        <Reveal delay={nextDelay()}>
          <LessonSection icon={SpellCheck2} title="Grammar" description="How the language works">
            <LessonGrammar points={lesson.grammarPoints} />
          </LessonSection>
        </Reveal>
      )}

      {hasDialogues && (
        <Reveal delay={nextDelay()}>
          <LessonSection
            icon={MessagesSquare}
            title="Conversation"
            description="See the words in a real exchange"
          >
            <LessonDialogues dialogues={lesson.dialogues} />
          </LessonSection>
        </Reveal>
      )}

      {hasReading && (
        <Reveal delay={nextDelay()}>
          <LessonSection icon={BookText} title="Reading" description="Read and understand">
            <LessonReading passages={lesson.readingPassages} />
          </LessonSection>
        </Reveal>
      )}

      {hasListening && (
        <Reveal delay={nextDelay()}>
          <LessonSection icon={Headphones} title="Listening" description="Train your ear">
            <LessonListening clips={lesson.listeningClips} />
          </LessonSection>
        </Reveal>
      )}

      {hasExercises && (
        <Reveal delay={nextDelay()}>
          <LessonSection
            icon={GraduationCap}
            title="Practice"
            description="Check what you've learned"
          >
            <LessonQuiz exercises={lesson.exercises} onProgressChange={setProgress} />
          </LessonSection>
        </Reveal>
      )}
    </div>
  );
}
