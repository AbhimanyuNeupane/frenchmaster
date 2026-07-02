"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner, optionStateClasses } from "./_shared";
import { AudioPlayer } from "./_media";

function ListeningCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "ListeningCard") return null;
  const { prompt, audio, options } = card.content;
  const correctId = card.validation.correctOptionId;
  const [selected, setSelected] = React.useState<string | null>(null);
  const locked = Boolean(answered) || disabled;

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <div className="rounded-xl border border-border bg-secondary/50 px-4 py-4">
        <AudioPlayer src={media.resolveAudioUrl(audio)} label="Listen again" />
      </div>
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={locked}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-colors disabled:cursor-default",
              optionStateClasses({
                selected: selected === opt.id,
                answered: Boolean(answered),
                isCorrectChoice: opt.id === correctId,
              })
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton onClick={() => selected && onSubmit(selected)} disabled={!selected} />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "ListeningCard",
  React.lazy(async () => ({ default: ListeningCard }))
);

export default ListeningCard;
