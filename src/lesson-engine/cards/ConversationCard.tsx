"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";
import { AudioPlayer } from "./_media";

function ConversationCard({ card }: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "ConversationCard") return null;
  const { scenario, lines } = card.content;

  // Alternate speaker alignment for a chat-like layout without hardcoding names.
  const speakers = Array.from(new Set(lines.map((l) => l.speaker)));

  return (
    <CardFrame title={card.title} subtitle={scenario}>
      <div className="flex flex-col gap-3">
        {lines.map((line, i) => {
          const isSecond = speakers.indexOf(line.speaker) % 2 === 1;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1",
                isSecond ? "items-end" : "items-start"
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {line.speaker}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5",
                  isSecond
                    ? "bg-accent/10 text-foreground"
                    : "bg-secondary text-foreground"
                )}
              >
                <p className="font-medium">{line.text}</p>
                {line.translation && (
                  <p className="text-sm text-muted-foreground">
                    {line.translation}
                  </p>
                )}
                {line.audio && (
                  <div className="mt-2">
                    <AudioPlayer
                      src={media.resolveAudioUrl(line.audio)}
                      label="Listen"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardFrame>
  );
}

registerCardComponent(
  "ConversationCard",
  React.lazy(async () => ({ default: ConversationCard }))
);

export default ConversationCard;
