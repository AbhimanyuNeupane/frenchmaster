"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner } from "./_shared";

function WritingCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "WritingCard") return null;
  const { prompt, placeholder } = card.content;
  const [value, setValue] = React.useState("");
  const locked = Boolean(answered) || disabled;

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <textarea
        value={value}
        disabled={locked}
        placeholder={placeholder ?? "Type your answer…"}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className={cn(
          "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        )}
      />
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton onClick={() => value.trim() && onSubmit(value)} disabled={!value.trim()} />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "WritingCard",
  React.lazy(async () => ({ default: WritingCard }))
);

export default WritingCard;
