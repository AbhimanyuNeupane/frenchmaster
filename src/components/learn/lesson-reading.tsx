"use client";

import { useState } from "react";

import { LessonSectionCard } from "@/components/learn/lesson-section";
import { TranslationToggle } from "@/components/learn/translation-toggle";
import type { ReadingPassage } from "@/types/lesson";

function ReadingBlock({ passage }: { passage: ReadingPassage }) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <LessonSectionCard>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-navy">{passage.title}</h3>
          <TranslationToggle
            showTranslation={showTranslation}
            onToggle={() => setShowTranslation((v) => !v)}
          />
        </div>

        {passage.audioUrl && <audio controls src={passage.audioUrl} className="w-full" />}

        <p className="text-[15px] leading-relaxed text-navy">{passage.bodyFr}</p>

        {showTranslation && (
          <div className="rounded-xl bg-secondary/60 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{passage.bodyEn}</p>
          </div>
        )}
      </div>
    </LessonSectionCard>
  );
}

export function LessonReading({ passages }: { passages: ReadingPassage[] }) {
  return (
    <div className="flex flex-col gap-4">
      {passages.map((passage) => (
        <ReadingBlock key={passage.id} passage={passage} />
      ))}
    </div>
  );
}
