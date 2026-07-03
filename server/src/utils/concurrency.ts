/**
 * Runs `fn` over `items` with at most `concurrency` in flight at once.
 * Backs admin.service.ts's AI bulk-translate job so it doesn't fire dozens
 * of parallel requests at a third-party API and risk rate-limiting.
 * Results are returned in the same order as `items`, regardless of
 * completion order. A single `fn` rejection does not cancel the others —
 * callers that want per-item error isolation should catch inside `fn`.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
