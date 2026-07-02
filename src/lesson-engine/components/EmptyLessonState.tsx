"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Explicit "nothing to show" state for a lesson with zero cards — never a
 *  blank screen. */
export function EmptyLessonState({ onExit }: { onExit?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Nothing to show</h2>
      <p className="text-sm text-muted-foreground">
        This lesson doesn&apos;t have any cards yet.
      </p>
      {onExit && (
        <Button variant="outline" onClick={onExit}>
          Back to lessons
        </Button>
      )}
    </div>
  );
}
