"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame, CheckButton, FeedbackBanner, optionStateClasses } from "./_shared";
import { SmartImage } from "./_media";

function ImageChoiceCard({
  card,
  onSubmit,
  result,
  answered,
  disabled,
}: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "ImageChoiceCard") return null;
  const { prompt, options } = card.content;
  const correctId = card.validation.correctOptionId;
  const [selected, setSelected] = React.useState<string | null>(null);
  const locked = Boolean(answered) || disabled;

  return (
    <CardFrame title={card.title} subtitle={prompt}>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={locked}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors disabled:cursor-default",
              optionStateClasses({
                selected: selected === opt.id,
                answered: Boolean(answered),
                isCorrectChoice: opt.id === correctId,
              })
            )}
          >
            <SmartImage
              src={media.resolveImageUrl(opt.image)}
              alt={opt.label ?? "option"}
              className="h-28 w-full"
            />
            {opt.label && (
              <span className="text-sm font-medium text-foreground">
                {opt.label}
              </span>
            )}
          </button>
        ))}
      </div>
      {result ? (
        <FeedbackBanner result={result} />
      ) : (
        <CheckButton
          onClick={() => selected && onSubmit(selected)}
          disabled={!selected}
        />
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "ImageChoiceCard",
  React.lazy(async () => ({ default: ImageChoiceCard }))
);

export default ImageChoiceCard;
