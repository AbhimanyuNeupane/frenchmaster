"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner, optionStateClasses } from "./_shared";

function MultipleChoiceCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "MultipleChoiceCard") return null;
  const { prompt, options } = card.content;
  // Reading the card's own typed `validation` for post-answer highlighting only;
  // the card never runs the validator (that stays in the engine).
  const correctId = card.validation.correctOptionId;
  const [selected, setSelected] = React.useState<string | null>(null);
  const locked = Boolean(answered) || disabled;

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={locked}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-colors disabled:cursor-default",
              optionStateClasses({
                selected: selected === opt.id,
                answered: Boolean(answered),
                isCorrectChoice: opt.id === correctId,
              })
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton onClick={() => selected && onSubmit(selected)} disabled={!selected} />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "MultipleChoiceCard",
  React.lazy(async () => ({ default: MultipleChoiceCard }))
);

export default MultipleChoiceCard;
