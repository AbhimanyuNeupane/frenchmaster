"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";

function SummaryCard({ card }: CardComponentProps) {
  if (card.type !== "SummaryCard") return null;
  const { heading, points } = card.content;
  return (
    <CardFrame title={card.title ?? heading ?? "Summary"}>
      <ul className="flex flex-col gap-3">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-4 w-4" />
            </span>
            <span className="text-sm leading-relaxed text-foreground">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

registerCardComponent(
  "SummaryCard",
  React.lazy(async () => ({ default: SummaryCard }))
);

export default SummaryCard;
