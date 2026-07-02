"use client";

import { useLanguageLookup } from "@/hooks/use-languages";
import { cn } from "@/lib/utils";
import type { Translation } from "@/types/language";

/**
 * Compact display of a word's native-language translation: the language's flag
 * emoji + the translated text. Renders nothing when `translation` is null (the
 * backend already applies the "skip if the user's language is English" rule, so
 * this component simply short-circuits on the field being absent). Shared by the
 * vocabulary card, the vocabulary detail dialog, and the lesson vocabulary list
 * so the flag lookup lives in exactly one place.
 */
export function NativeTranslation({
  translation,
  className,
}: {
  translation: Translation | null;
  className?: string;
}) {
  const lookup = useLanguageLookup();
  if (!translation) return null;

  const language = lookup(translation.languageCode);
  return (
    <p
      className={cn("flex items-center gap-1.5 text-sm text-foreground/80", className)}
      title={language ? language.name : undefined}
    >
      <span aria-hidden className="text-base leading-none">
        {language?.flagEmoji ?? "🌐"}
      </span>
      <span>{translation.text}</span>
    </p>
  );
}
