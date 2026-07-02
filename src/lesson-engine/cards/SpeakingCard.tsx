"use client";

import * as React from "react";
import { Mic } from "lucide-react";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame, FeedbackBanner } from "./_shared";
import { AudioPlayer } from "./_media";

/**
 * Speaking practice UI. Real speech recognition is a future phase — this card
 * captures the intent to record and hands a placeholder response to the engine,
 * whose SpeakingCard validator returns a placeholder score. The mic button is
 * the seam where a future recorder/ASR call plugs in.
 */
function SpeakingCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "SpeakingCard") return null;
  const { prompt, targetText, referenceAudio } = card.content;
  const locked = Boolean(answered) || disabled;

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <p className="rounded-xl border border-border bg-secondary/50 px-4 py-4 text-lg font-medium text-foreground">
        {targetText}
      </p>
      {referenceAudio && (
        <AudioPlayer src={media.resolveAudioUrl(referenceAudio)} label="Hear it" />
      )}
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <button
          type="button"
          disabled={locked}
          onClick={() => onSubmit({ recorded: true, target: targetText })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 font-semibold text-white shadow-sm transition-transform hover:bg-accent-hover active:scale-95 disabled:opacity-50"
        >
          <Mic className="h-5 w-5" />
          Tap to speak
        </button>
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "SpeakingCard",
  React.lazy(async () => ({ default: SpeakingCard }))
);

export default SpeakingCard;
