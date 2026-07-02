"use client";

import * as React from "react";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";
import { AudioPlayer } from "./_media";

function AudioCard({ card }: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "AudioCard") return null;
  const { audio, caption, transcript } = card.content;
  return (
    <CardFrame title={card.title} subtitle={caption}>
      <AudioPlayer src={media.resolveAudioUrl(audio)} label="Play" />
      {transcript && (
        <p className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-foreground">
          {transcript}
        </p>
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "AudioCard",
  React.lazy(async () => ({ default: AudioCard }))
);

export default AudioCard;
