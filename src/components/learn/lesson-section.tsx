import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

/**
 * Shared wrapper for a single section of the lesson player (Vocabulary,
 * Grammar, Conversation, …). Keeps the section header styling consistent
 * across every section of the lesson.
 */
export function LessonSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-navy">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A section-level card used to hold section body content. */
export function LessonSectionCard({ children }: { children: ReactNode }) {
  return <Card className="p-5 sm:p-6">{children}</Card>;
}
