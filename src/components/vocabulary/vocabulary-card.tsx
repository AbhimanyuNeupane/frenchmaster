"use client";

import { Star, Volume2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VocabularyWord } from "@/types";

const GENDER_LABEL: Record<NonNullable<VocabularyWord["gender"]>, string> = {
  masculine: "m.",
  feminine: "f.",
  neutral: "n.",
};

const MASTERY_LABEL: Record<VocabularyWord["masteryStatus"], string> = {
  new: "New",
  learning: "Learning",
  mastered: "Mastered",
};

const MASTERY_VARIANT: Record<VocabularyWord["masteryStatus"], "outline" | "warning" | "success"> = {
  new: "outline",
  learning: "warning",
  mastered: "success",
};

export function VocabularyCard({
  word,
  onOpen,
  onToggleFavorite,
}: {
  word: VocabularyWord;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className="group flex cursor-pointer flex-col gap-3 p-5 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {word.gender && (
            <Badge variant="outline" className="lowercase">
              {GENDER_LABEL[word.gender]}
            </Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {word.partOfSpeech}
          </Badge>
        </div>
        <button
          type="button"
          aria-label={word.isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-warning"
        >
          <Star
            className={cn("size-4", word.isFavorite && "fill-warning text-warning")}
          />
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-navy">{word.french}</h3>
          <button
            type="button"
            aria-label="Play pronunciation"
            disabled={!word.audioUrl}
            onClick={(e) => e.stopPropagation()}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
          >
            <Volume2 className="size-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{word.pronunciationIpa}</p>
      </div>

      <p className="text-sm text-foreground/80">{word.english}</p>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-[11px] font-medium text-muted-foreground">{word.unitTitle}</span>
        <Badge variant={MASTERY_VARIANT[word.masteryStatus]}>
          {MASTERY_LABEL[word.masteryStatus]}
        </Badge>
      </div>
    </Card>
  );
}
