"use client";

import { useState } from "react";

import { LessonSectionCard } from "@/components/learn/lesson-section";
import { TranslationToggle } from "@/components/learn/translation-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Dialogue } from "@/types/lesson";

function DialogueBlock({ dialogue }: { dialogue: Dialogue }) {
  const [showTranslation, setShowTranslation] = useState(false);

  // Assign a consistent left/right side per speaker, by order of appearance.
  const speakerOrder = Array.from(new Set(dialogue.lines.map((l) => l.speaker)));

  return (
    <LessonSectionCard>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-navy">{dialogue.title}</h3>
            {dialogue.context && (
              <Badge variant="outline" className="mt-1.5">
                {dialogue.context}
              </Badge>
            )}
          </div>
          <TranslationToggle
            showTranslation={showTranslation}
            onToggle={() => setShowTranslation((v) => !v)}
          />
        </div>

        <div className="flex flex-col gap-3">
          {dialogue.lines.map((line, i) => {
            const isRight = speakerOrder.indexOf(line.speaker) % 2 === 1;
            return (
              <div
                key={i}
                className={cn("flex flex-col gap-1", isRight ? "items-end" : "items-start")}
              >
                <span className="px-1 text-xs font-semibold text-muted-foreground">
                  {line.speaker}
                </span>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5",
                    isRight
                      ? "rounded-tr-sm bg-accent/10 text-navy"
                      : "rounded-tl-sm bg-secondary text-navy"
                  )}
                >
                  <p className="text-sm font-medium">{line.frenchText}</p>
                  {showTranslation && (
                    <p className="mt-1 text-xs text-muted-foreground">{line.englishText}</p>
                  )}
                  {line.audioUrl && (
                    <audio controls src={line.audioUrl} className="mt-2 h-8 w-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LessonSectionCard>
  );
}

export function LessonDialogues({ dialogues }: { dialogues: Dialogue[] }) {
  return (
    <div className="flex flex-col gap-4">
      {dialogues.map((dialogue) => (
        <DialogueBlock key={dialogue.id} dialogue={dialogue} />
      ))}
    </div>
  );
}
