"use client";

import { useState } from "react";
import { Headphones } from "lucide-react";

import { LessonSectionCard } from "@/components/learn/lesson-section";
import { TranslationToggle } from "@/components/learn/translation-toggle";
import type { ListeningClip } from "@/types/lesson";

function ListeningBlock({ clip }: { clip: ListeningClip }) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <LessonSectionCard>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-navy">{clip.title}</h3>
          <TranslationToggle
            showTranslation={showTranslation}
            onToggle={() => setShowTranslation((v) => !v)}
          />
        </div>

        {clip.audioUrl ? (
          <audio controls src={clip.audioUrl} className="w-full" />
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
            <Headphones className="size-4 shrink-0" />
            Native audio for this clip is coming soon. Read the transcript below for now.
          </div>
        )}

        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transcript
          </p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-navy">
            {clip.transcriptFr}
          </p>
        </div>

        {showTranslation && (
          <div className="rounded-xl bg-secondary/60 p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {clip.transcriptEn}
            </p>
          </div>
        )}
      </div>
    </LessonSectionCard>
  );
}

export function LessonListening({ clips }: { clips: ListeningClip[] }) {
  return (
    <div className="flex flex-col gap-4">
      {clips.map((clip) => (
        <ListeningBlock key={clip.id} clip={clip} />
      ))}
    </div>
  );
}
