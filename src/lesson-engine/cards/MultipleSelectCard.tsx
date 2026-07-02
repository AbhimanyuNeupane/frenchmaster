"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner, optionStateClasses } from "./_shared";

function MultipleSelectCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "MultipleSelectCard") return null;
  const { prompt, options } = card.content;
  const correctIds = new Set(card.validation.correctOptionIds);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const locked = Boolean(answered) || disabled;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Select all that apply
      </p>
      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const isSel = selected.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              onClick={() => toggle(opt.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-colors disabled:cursor-default",
                optionStateClasses({
                  selected: isSel,
                  answered: Boolean(answered),
                  isCorrectChoice: correctIds.has(opt.id),
                })
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-md border",
                  isSel ? "border-accent bg-accent text-white" : "border-border"
                )}
              >
                {isSel && <Check className="h-3.5 w-3.5" />}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton
          onClick={() => onSubmit([...selected])}
          disabled={selected.size === 0}
        />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "MultipleSelectCard",
  React.lazy(async () => ({ default: MultipleSelectCard }))
);

export default MultipleSelectCard;
