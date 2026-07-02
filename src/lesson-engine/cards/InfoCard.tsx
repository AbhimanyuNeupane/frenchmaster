"use client";

import * as React from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";

const TONE = {
  note: { Icon: Info, cls: "bg-navy/5 text-navy border-navy/20" },
  tip: { Icon: Lightbulb, cls: "bg-success/10 text-success border-success/25" },
  warning: {
    Icon: TriangleAlert,
    cls: "bg-warning/10 text-warning border-warning/25",
  },
} as const;

function InfoCard({ card }: CardComponentProps) {
  if (card.type !== "InfoCard") return null;
  const { body, tone = "note" } = card.content;
  const { Icon, cls } = TONE[tone];
  return (
    <CardFrame title={card.title}>
      <div className={cn("flex gap-3 rounded-xl border p-4", cls)}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
          {body}
        </p>
      </div>
    </CardFrame>
  );
}

registerCardComponent(
  "InfoCard",
  React.lazy(async () => ({ default: InfoCard }))
);

export default InfoCard;
