"use client";

import * as React from "react";
import { registerCardComponent } from "../registry/componentRegistry";
import { useMediaService } from "../hooks/useMediaService";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";
import { SmartImage } from "./_media";

function ImageCard({ card }: CardComponentProps) {
  const media = useMediaService();
  if (card.type !== "ImageCard") return null;
  const { image, alt, caption } = card.content;
  return (
    <CardFrame title={card.title}>
      <SmartImage src={media.resolveImageUrl(image)} alt={alt} className="w-full" />
      {caption && (
        <p className="text-center text-sm text-muted-foreground">{caption}</p>
      )}
    </CardFrame>
  );
}

registerCardComponent(
  "ImageCard",
  React.lazy(async () => ({ default: ImageCard }))
);

export default ImageCard;
