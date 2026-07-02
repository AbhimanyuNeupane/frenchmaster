"use client";

import * as React from "react";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";

function GrammarCard({ card }: CardComponentProps) {
  if (card.type !== "GrammarCard") return null;
  const { explanation, examples } = card.content;
  return (
    <CardFrame title={card.title ?? "Grammar"}>
      <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
        {explanation}
      </p>
      <div className="flex flex-col gap-2">
        {examples.map((ex, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-secondary/50 px-4 py-3"
          >
            <p className="font-semibold text-foreground">{ex.text}</p>
            {ex.translation && (
              <p className="text-sm text-muted-foreground">{ex.translation}</p>
            )}
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

registerCardComponent(
  "GrammarCard",
  React.lazy(async () => ({ default: GrammarCard }))
);

export default GrammarCard;
