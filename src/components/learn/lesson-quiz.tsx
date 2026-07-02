"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, PartyPopper, RotateCcw, Sparkles, XCircle } from "lucide-react";

import { ExerciseInput } from "@/components/learn/exercise-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Exercise, ExerciseAttemptResult } from "@/types/lesson";

const XP_PER_CORRECT = 10; // mirrors the server's flat award per correct answer

const TYPE_LABEL: Record<Exercise["type"], string> = {
  multiple_choice: "Multiple choice",
  true_false: "True or false",
  fill_blank: "Fill in the blank",
  arrange_sentence: "Arrange the sentence",
  match: "Match",
  audio_question: "Listening",
  image_question: "Picture",
  typing: "Type the answer",
  speaking_prompt: "Speaking",
};

export function LessonQuiz({
  exercises,
  onProgressChange,
}: {
  exercises: Exercise[];
  onProgressChange: (progress: number) => void;
}) {
  const { authedFetch } = useAuth();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ExerciseAttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = exercises.length;
  const current = exercises[index];
  const isLast = index === total - 1;

  async function handleSubmit() {
    if (!current || result || !answer.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authedFetch<ExerciseAttemptResult>(
        `/api/lessons/exercises/${current.id}/attempt`,
        { method: "POST", body: JSON.stringify({ answer }) }
      );
      setResult(res);
      if (res.isCorrect) setCorrectCount((c) => c + 1);
      onProgressChange(res.lessonProgress);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit your answer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
    setError(null);
  }

  function handleRestart() {
    setIndex(0);
    setAnswer("");
    setResult(null);
    setError(null);
    setCorrectCount(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <Card className="relative overflow-hidden border-none bg-navy p-8 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/20 text-accent">
            <PartyPopper className="size-7" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Lesson complete!</h3>
            <p className="mt-1 text-sm text-white/70">
              You answered {correctCount} of {total} correctly.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-accent">
            <Sparkles className="size-4" />+{correctCount * XP_PER_CORRECT} XP earned
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button variant="accent" asChild>
              <Link href="/learn">Back to Learn</Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleRestart}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <RotateCcw className="size-4" />
              Review again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!current) return null;

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{TYPE_LABEL[current.type] ?? "Exercise"}</Badge>
          <span className="text-xs font-medium text-muted-foreground">
            Question {index + 1} of {total}
          </span>
        </div>
        <Progress value={((index + (result ? 1 : 0)) / total) * 100} />
      </div>

      <p className="text-base font-semibold text-navy">{current.prompt}</p>

      <ExerciseInput
        exercise={current}
        value={answer}
        onChange={setAnswer}
        disabled={result !== null}
      />

      {result && (
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-xl p-3.5",
            result.isCorrect ? "bg-success/10" : "bg-danger/10"
          )}
        >
          {result.isCorrect ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
          )}
          <div className="text-sm">
            <p className={cn("font-semibold", result.isCorrect ? "text-success" : "text-danger")}>
              {result.isCorrect ? "Correct!" : "Not quite."}
            </p>
            {!result.isCorrect && (
              <p className="mt-0.5 text-navy">
                Correct answer: <span className="font-semibold">{result.correctAnswer}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {result ? (
          <Button variant="accent" onClick={handleNext}>
            {isLast ? "Finish" : "Next"}
          </Button>
        ) : (
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
          >
            {isSubmitting ? "Checking…" : "Check"}
          </Button>
        )}
      </div>
    </Card>
  );
}
