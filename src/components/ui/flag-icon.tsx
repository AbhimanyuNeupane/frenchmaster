import { emojiFlagToCountryCode } from "@/lib/flag";
import { cn } from "@/lib/utils";

/**
 * Renders a real flag graphic from a regional-indicator flag emoji, via the
 * `flag-icons` CSS sprite (`fi fi-<cc>`, indexed by ISO 3166-1 alpha-2 country
 * code). This avoids the Windows font quirk where flag emoji render as the
 * literal two-letter code ("NP") instead of an actual flag.
 *
 * The icon itself is decorative (`aria-hidden`), so pass `label` (e.g. the
 * language name) to expose an accessible name to screen readers via `title`.
 * If the input isn't a standard flag emoji (an admin can type anything into the
 * `flagEmoji` field), we fall back to rendering the raw text unchanged so
 * nothing visually breaks.
 */
export function FlagIcon({
  flagEmoji,
  label,
  className,
}: {
  flagEmoji: string;
  label?: string;
  className?: string;
}) {
  const code = emojiFlagToCountryCode(flagEmoji);

  if (!code) {
    return (
      <span aria-hidden title={label} className={className}>
        {flagEmoji}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      title={label}
      className={cn("fi", `fi-${code}`, className)}
    />
  );
}
