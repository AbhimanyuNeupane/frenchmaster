"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import { shuffle } from "../utils/shuffle";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner } from "./_shared";

/**
 * Tap-to-connect matching. Left column is fixed; the right column is shuffled
 * for display. A correct match is left.id === right.id (both come from the same
 * pair). The response submitted is a { leftId: rightId } map; correctness is
 * derived by the validator, not here.
 */
function MatchingCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  if (card.type !== "MatchingCard") return null;
  const { prompt, pairs } = card.content;
  const locked = Boolean(answered) || disabled;

  const rights = React.useMemo(
    () => shuffle(pairs.map((p) => ({ id: p.id, text: p.right }))),
    [pairs]
  );

  const [selectedLeft, setSelectedLeft] = React.useState<string | null>(null);
  const [matches, setMatches] = React.useState<Record<string, string>>({});

  const rightToLeft = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const [l, r] of Object.entries(matches)) m[r] = l;
    return m;
  }, [matches]);

  const pickLeft = (leftId: string) => {
    if (locked) return;
    setSelectedLeft((cur) => (cur === leftId ? null : leftId));
  };

  const pickRight = (rightId: string) => {
    if (locked || !selectedLeft) return;
    setMatches((prev) => {
      const next: Record<string, string> = {};
      // Drop any existing use of this right or this left, then assign.
      for (const [l, r] of Object.entries(prev)) {
        if (l === selectedLeft || r === rightId) continue;
        next[l] = r;
      }
      next[selectedLeft] = rightId;
      return next;
    });
    setSelectedLeft(null);
  };

  const allMatched = Object.keys(matches).length === pairs.length;

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {pairs.map((p) => {
            const matched = p.id in matches;
            const isCorrect = matches[p.id] === p.id;
            return (
              <button
                key={p.id}
                type="button"
                disabled={locked}
                onClick={() => pickLeft(p.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
                  answered && matched && isCorrect && "border-success bg-success/10",
                  answered && matched && !isCorrect && "border-danger bg-danger/10",
                  !answered && selectedLeft === p.id && "border-accent bg-accent/10",
                  !answered && selectedLeft !== p.id && matched && "border-accent/50 bg-accent/5",
                  !matched && selectedLeft !== p.id && "border-border bg-card"
                )}
              >
                {p.left}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rights.map((r) => {
            const used = r.id in rightToLeft;
            return (
              <button
                key={r.id}
                type="button"
                disabled={locked}
                onClick={() => pickRight(r.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
                  used ? "border-accent/50 bg-accent/5" : "border-border bg-card",
                  "hover:border-accent/60"
                )}
              >
                {r.text}
              </button>
            );
          })}
        </div>
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton onClick={() => onSubmit(matches)} disabled={!allMatched} />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "MatchingCard",
  React.lazy(async () => ({ default: MatchingCard }))
);

export default MatchingCard;
