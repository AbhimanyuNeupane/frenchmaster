"use client";

import * as React from "react";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";

function TextCard({ card }: CardComponentProps) {
  if (card.type !== "TextCard") return null;
  const { body, subtitle } = card.content;
  return (
    <CardFrame title={card.title} subtitle={subtitle}>
      <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
        {body}
      </p>
    </CardFrame>
  );
}

registerCardComponent(
  "TextCard",
  React.lazy(async () => ({ default: TextCard }))
);

export default TextCard;
