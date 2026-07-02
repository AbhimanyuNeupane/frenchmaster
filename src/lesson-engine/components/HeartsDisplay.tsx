"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeartsDisplay({ hearts, max = 5 }: { hearts: number; max?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${hearts} hearts remaining`}>
      {Array.from({ length: max }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "h-4 w-4",
            i < hearts ? "fill-danger text-danger" : "text-border"
          )}
        />
      ))}
    </div>
  );
}
