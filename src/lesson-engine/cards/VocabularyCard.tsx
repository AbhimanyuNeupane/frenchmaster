"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";
import { AudioPlayer, SmartImage } from "./_media";

function VocabularyCard({ card }: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "VocabularyCard") return null;
  const c = card.content;

  return (
    <CardFrame title={card.title ?? "Vocabulary"}>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-foreground">{c.word}</span>
              {c.gender && c.gender !== "none" && (
                <Badge variant="accent">{c.gender}</Badge>
              )}
            </div>
            {c.pronunciation && (
              <span className="text-sm text-muted-foreground">
                {c.pronunciation}
                {c.ipa ? ` · /${c.ipa}/` : ""}
              </span>
            )}
            {c.partOfSpeech && (
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {c.partOfSpeech}
                {c.plural ? ` · pl. ${c.plural}` : ""}
              </span>
            )}
          </div>
          {c.image && (
            <SmartImage
              src={media.resolveImageUrl(c.image)}
              alt={c.word}
              className="h-24 w-24"
            />
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-foreground">{c.nativeTranslation}</p>
          <p className="text-sm text-muted-foreground">{c.englishTranslation}</p>
        </div>

        {c.audio && (
          <AudioPlayer src={media.resolveAudioUrl(c.audio)} label="Pronounce" />
        )}

        {(c.exampleSentence || c.nativeExample) && (
          <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3">
            {c.exampleSentence && (
              <p className="font-medium text-foreground">{c.exampleSentence}</p>
            )}
            {c.nativeExample && (
              <p className="text-sm text-muted-foreground">{c.nativeExample}</p>
            )}
          </div>
        )}
      </div>
    </CardFrame>
  );
}

registerCardComponent(
  "VocabularyCard",
  React.lazy(async () => ({ default: VocabularyCard }))
);

export default VocabularyCard;
