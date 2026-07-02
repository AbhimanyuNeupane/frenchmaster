"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner } from "./_shared";

const BLANK = "___";

function FillBlankCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "FillBlankCard") return null;
  const { textWithBlanks, hint } = card.content;
  const [value, setValue] = React.useState("");
  const locked = Boolean(answered) || disabled;

  const [before, after] = React.useMemo(() => {
    const idx = textWithBlanks.indexOf(BLANK);
    if (idx === -1) return [textWithBlanks, ""];
    return [textWithBlanks.slice(0, idx), textWithBlanks.slice(idx + BLANK.length)];
  }, [textWithBlanks]);

  const submit = () => {
    if (value.trim()) onSubmit(value);
  };

  return (
    <CardFrame title={card.title} subtitle={hint}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-4 text-lg text-foreground">
        <span>{before}</span>
        <Input
          value={value}
          disabled={locked}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !locked) submit();
          }}
          className="inline-flex h-10 w-40 bg-card"
          placeholder="…"
          aria-label="Fill in the blank"
        />
        <span>{after}</span>
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton onClick={submit} disabled={!value.trim()} />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "FillBlankCard",
  React.lazy(async () => ({ default: FillBlankCard }))
);

export default FillBlankCard;
