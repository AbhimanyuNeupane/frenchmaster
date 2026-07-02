"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner, optionStateClasses } from "./_shared";

function TrueFalseCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "TrueFalseCard") return null;
  const { statement } = card.content;
  const correct = card.validation.answer;
  const [choice, setChoice] = React.useState<boolean | null>(null);
  const locked = Boolean(answered) || disabled;

  const buttons: { label: string; value: boolean }[] = [
    { label: "True", value: true },
    { label: "False", value: false },
  ];

  return (
    <CardFrame title={card.title}>
      <p className="rounded-xl border border-border bg-secondary/50 px-4 py-4 text-lg font-medium text-foreground">
        {statement}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={locked}
            onClick={() => setChoice(b.value)}
            className={cn(
              "rounded-xl border px-4 py-4 text-base font-semibold transition-colors disabled:cursor-default",
              optionStateClasses({
                selected: choice === b.value,
                answered: Boolean(answered),
                isCorrectChoice: b.value === correct,
              })
            )}
          >
            {b.label}
          </button>
        ))}
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton
          onClick={() => choice !== null && onSubmit(choice)}
          disabled={choice === null}
        />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "TrueFalseCard",
  React.lazy(async () => ({ default: TrueFalseCard }))
);

export default TrueFalseCard;
