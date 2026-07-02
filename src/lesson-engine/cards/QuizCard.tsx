"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner } from "./_shared";

/**
 * A mini multi-step quiz within a single card. It reuses the MC/TrueFalse
 * response shapes internally, collects one answer per sub-question, and submits
 * the whole answer map at the end. The QuizCard validator scores it — this card
 * never computes correctness itself.
 */
function QuizCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "QuizCard") return null;
  const { intro, questions } = card.content;
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string | boolean>>({});
  const locked = Boolean(answered) || disabled;

  const q = questions[step];
  const isLast = step === questions.length - 1;
  const currentAnswered = q ? q.id in answers : false;

  const setAnswer = (value: string | boolean) => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const advance = () => {
    if (isLast) onSubmit(answers);
    else setStep((s) => s + 1);
  };

  if (result) {
    return (
      <CardFrame title={card.title ?? "Quiz"}>
        <FeedbackBanner result={result} />
      </CardFrame>
    );
  }

  return (
    <CardFrame title={card.title ?? "Quiz"} subtitle={intro}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>
          Question {step + 1} of {questions.length}
        </span>
      </div>

      <p className="text-lg font-semibold text-foreground">{q.prompt}</p>

      {q.kind === "mc" ? (
        <div className="flex flex-col gap-3">
          {q.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              onClick={() => setAnswer(opt.id)}
              className={cn(
                "rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-colors",
                answers[q.id] === opt.id
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:border-accent/60"
              )}
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "True", value: true },
            { label: "False", value: false },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              disabled={locked}
              onClick={() => setAnswer(b.value)}
              className={cn(
                "rounded-xl border px-4 py-4 text-base font-semibold transition-colors",
                answers[q.id] === b.value
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:border-accent/60"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      <CheckButton
        onClick={advance}
        disabled={!currentAnswered}
        label={isLast ? "Finish quiz" : "Next question"}
      />
    </CardFrame>
  );
}

registerCardComponent(
  "QuizCard",
  React.lazy(async () => ({ default: QuizCard }))
);

export default QuizCard;
