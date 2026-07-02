/** Normalizes a string for tolerant comparison: trims, lowercases, collapses
 *  internal whitespace, and strips surrounding punctuation. */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[.,!?;:'"]+|[.,!?;:'"]+$/g, "");
}

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Fuzzy equality with a distance tolerance that scales with word length: allows
 * ~1 edit per 6 characters (min 1). Keeps typos forgiving without accepting
 * unrelated words. Intentionally simple — real scoring is a future phase.
 */
export function fuzzyEquals(a: string, b: string): boolean {
  const na = normalizeAnswer(a);
  const nb = normalizeAnswer(b);
  if (na === nb) return true;
  const tolerance = Math.max(1, Math.floor(Math.max(na.length, nb.length) / 6));
  return levenshtein(na, nb) <= tolerance;
}
