"use client";

import { useState } from "react";
import { ImageOff, Lightbulb, Star, Volume2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VocabularyWord } from "@/types";

const GENDER_LABEL: Record<NonNullable<VocabularyWord["gender"]>, string> = {
  masculine: "masculine",
  feminine: "feminine",
  neutral: "neutral",
};

const SPEEDS = ["Slow", "Normal", "Fast"] as const;

export function VocabularyDetailDialog({
  word,
  open,
  onOpenChange,
  onToggleFavorite,
  onMarkReviewed,
}: {
  word: VocabularyWord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onMarkReviewed: (id: string) => void;
}) {
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>("Normal");
  const [showTranslation, setShowTranslation] = useState(true);

  if (!word) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {word.gender && (
              <Badge variant="outline">{GENDER_LABEL[word.gender]}</Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {word.partOfSpeech}
            </Badge>
            <Badge variant="accent">{word.level}</Badge>
          </div>
          <DialogTitle className="text-2xl">{word.french}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {word.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={word.imageUrl}
              alt={word.french}
              className="h-40 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <div>
              <p className="text-sm font-semibold text-navy">{word.pronunciationIpa}</p>
              <p className="text-xs text-muted-foreground">{word.english}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      speed === s
                        ? "bg-navy text-white"
                        : "text-muted-foreground hover:text-navy"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button
                variant="accent"
                size="icon"
                disabled={!word.audioUrl}
                aria-label="Play pronunciation"
              >
                <Volume2 className="size-4" />
              </Button>
            </div>
          </div>
          {!word.audioUrl && (
            <p className="-mt-3 text-[11px] text-muted-foreground">
              Native audio isn&apos;t available for this word yet.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Example
              </p>
              <button
                type="button"
                onClick={() => setShowTranslation((v) => !v)}
                className="text-xs font-semibold text-accent hover:text-accent-hover"
              >
                {showTranslation ? "Hide" : "Show"} translation
              </button>
            </div>
            <p className="text-sm font-medium text-navy">{word.exampleFr}</p>
            {showTranslation && (
              <p className="text-sm text-muted-foreground">{word.exampleEn}</p>
            )}
          </div>

          {word.synonyms.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Synonyms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {word.synonyms.map((s) => (
                  <Badge key={s} variant="default">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {word.commonMistake && (
            <div className="flex gap-2.5 rounded-xl bg-warning/10 p-3.5">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm text-navy">{word.commonMistake}</p>
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Button
              variant={word.isFavorite ? "secondary" : "outline"}
              className="flex-1"
              onClick={() => onToggleFavorite(word.id)}
            >
              <Star className={cn("size-4", word.isFavorite && "fill-warning text-warning")} />
              {word.isFavorite ? "Favorited" : "Add to Favorites"}
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              disabled={word.masteryStatus === "mastered"}
              onClick={() => onMarkReviewed(word.id)}
            >
              {word.masteryStatus === "mastered" ? "Mastered" : "Mark as Reviewed"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
