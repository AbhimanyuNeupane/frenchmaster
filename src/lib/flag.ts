/**
 * Flag-emoji helpers.
 *
 * Regional-indicator flag emoji (e.g. "🇳🇵") are two Unicode codepoints in the
 * range U+1F1E6–U+1F1FF, each mapping 1:1 to a Latin letter A–Z. We convert
 * those to an ISO 3166-1 alpha-2 country code so the UI can render a real flag
 * graphic (via the `flag-icons` CSS sprite, indexed by country code) instead of
 * relying on the OS emoji font — which on Windows frequently renders the raw
 * emoji as the literal two-letter code ("NP") rather than a flag glyph.
 */

const REGIONAL_INDICATOR_BASE = 0x1f1e6; // "🇦"
const REGIONAL_INDICATOR_LAST = 0x1f1ff; // "🇿"

/**
 * Converts a regional-indicator flag emoji to its lowercase ISO 3166-1 alpha-2
 * country code (e.g. "🇳🇵" → "np"). Returns `null` for anything that isn't
 * exactly two regional-indicator codepoints — an admin can type arbitrary text
 * into the `flagEmoji` field, so callers must handle the null (fallback) case.
 */
export function emojiFlagToCountryCode(flagEmoji: string): string | null {
  if (!flagEmoji) return null;

  // Iterate by codepoint, not UTF-16 code unit: these characters live outside
  // the BMP, so `.length` / index access would split a surrogate pair.
  const codepoints = Array.from(flagEmoji, (ch) => ch.codePointAt(0) ?? 0);
  if (codepoints.length !== 2) return null;

  const letters = codepoints.map((cp) => {
    if (cp < REGIONAL_INDICATOR_BASE || cp > REGIONAL_INDICATOR_LAST) return null;
    // 0x1F1E6 ("🇦") → "a", … 0x1F1FF ("🇿") → "z".
    return String.fromCharCode(97 + (cp - REGIONAL_INDICATOR_BASE));
  });

  if (letters.some((l) => l === null)) return null;
  return letters.join("");
}
