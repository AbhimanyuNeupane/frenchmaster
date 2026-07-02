"use client";

import * as React from "react";
import { registerCardComponent } from "../registry/componentRegistry";
import type { CardComponentProps } from "../types";
import { CardFrame } from "./_shared";
import { RewardAnimation } from "../components/RewardAnimation";

function RewardCard({ card }: CardComponentProps) {
  if (card.type !== "RewardCard") return null;
  const { title, message, xp, badge } = card.content;
  return (
    <CardFrame>
      <RewardAnimation title={title} message={message} xp={xp} badge={badge} />
    </CardFrame>
  );
}

registerCardComponent(
  "RewardCard",
  React.lazy(async () => ({ default: RewardCard }))
);

export default RewardCard;
