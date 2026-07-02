/**
 * Fisher–Yates shuffle. Returns a NEW array; never mutates the input. Used by
 * matching/drag-order cards to randomize display order without touching the
 * canonical order stored in validation.
 */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
