"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps, OrderableItem } from "../types";
import { CardFrame, CheckButton, FeedbackBanner } from "./_shared";

/**
 * Reordering via accessible up/down controls (keyboard- and test-friendly, and
 * no drag-and-drop dependency). Items arrive pre-shuffled from the lesson JSON;
 * the correct sequence lives in validation and is never read here.
 */
function DragOrderCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "DragOrderCard") return null;
  const { prompt, items } = card.content;
  const [order, setOrder] = React.useState<OrderableItem[]>(items);
  const locked = Boolean(answered) || disabled;

  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <ul className="flex flex-col gap-2">
        {order.map((item, i) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            )}
          >
            <span className="flex items-center gap-3 text-base font-medium text-foreground">
              <span className="text-sm text-muted-foreground">{i + 1}.</span>
              {item.text}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                aria-label={`Move ${item.text} up`}
                disabled={locked || i === 0}
                onClick={() => move(i, -1)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${item.text} down`}
                disabled={locked || i === order.length - 1}
                onClick={() => move(i, 1)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton onClick={() => onSubmit(order.map((o) => o.id))} />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "DragOrderCard",
  React.lazy(async () => ({ default: DragOrderCard }))
);

export default DragOrderCard;
