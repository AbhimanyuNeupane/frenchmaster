"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";

function FlashCard({ card }: CardComponentProps) {
  if (card.type !== "FlashCard") return null;
  const { front, back, hint } = card.content;
  const [flipped, setFlipped] = React.useState(false);

  return (
    <CardFrame title={card.title} subtitle={hint}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="relative h-56 w-full [perspective:1200px]"
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 [backface-visibility:hidden]">
            <span className="text-2xl font-bold text-foreground">{front}</span>
            <span className="text-xs text-muted-foreground">Tap to flip</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-accent bg-accent/10 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-2xl font-bold text-foreground">{back}</span>
          </div>
        </motion.div>
      </button>
    </CardFrame>
  );
}

registerCardComponent(
  "FlashCard",
  React.lazy(async () => ({ default: FlashCard }))
);

export default FlashCard;
