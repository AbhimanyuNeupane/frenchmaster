"use client";

/**
 * Card-agnostic media primitives with graceful missing-asset fallbacks (part of
 * the Error Handling requirement). Not a card type; never registered.
 */
import * as React from "react";
import { ImageOff, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SmartImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/60 p-8 text-muted-foreground",
          className
        )}
      >
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">{alt || "Image unavailable"}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- opaque runtime keys, not statically known
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("max-w-full rounded-xl object-cover", className)}
    />
  );
}

export function AudioPlayer({
  src,
  label = "Play audio",
}: {
  src: string;
  label?: string;
}) {
  const ref = React.useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = React.useState(false);

  const play = () => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => setFailed(true));
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={play}
        disabled={failed}
        aria-label={label}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-sm transition-transform hover:bg-accent-hover active:scale-95 disabled:opacity-50"
      >
        <Play className="h-5 w-5" />
      </button>
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        {failed ? "Audio unavailable" : label}
      </span>
      <audio ref={ref} src={src} preload="none" onError={() => setFailed(true)} />
    </div>
  );
}
