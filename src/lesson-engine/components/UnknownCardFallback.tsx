"use client";

import { HelpCircle } from "lucide-react";

/**
 * Rendered when a card's `type` has no registered component (e.g. a lesson
 * authored for a newer card type than this client ships). It logs a warning and
 * lets the learner continue — an unknown card never blocks the lesson.
 */
export function UnknownCardFallback({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/50 p-8 text-center">
      <HelpCircle className="h-6 w-6 text-muted-foreground" />
      <p className="font-semibold text-foreground">Unsupported card</p>
      <p className="text-sm text-muted-foreground">
        This lesson uses a card type (<code className="font-mono">{type}</code>)
        this app doesn&apos;t know how to display yet. You can keep going.
      </p>
    </div>
  );
}
