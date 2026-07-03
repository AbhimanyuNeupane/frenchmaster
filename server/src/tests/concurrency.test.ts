import { describe, it, expect } from "vitest";
import { mapWithConcurrency } from "../utils/concurrency";

describe("mapWithConcurrency", () => {
  it("returns results in the same order as input regardless of completion order", async () => {
    const items = [30, 10, 20];
    const result = await mapWithConcurrency(items, 3, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms;
    });
    expect(result).toEqual([30, 10, 20]);
  });

  it("never runs more than `concurrency` items at once", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);

    await mapWithConcurrency(items, 3, async (i) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return i;
    });

    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it("processes every item exactly once", async () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const seen: number[] = [];
    await mapWithConcurrency(items, 4, async (i) => {
      seen.push(i);
      return i;
    });
    expect(seen.sort((a, b) => a - b)).toEqual(items);
  });

  it("handles an empty input array", async () => {
    const result = await mapWithConcurrency<number, number>([], 5, async (i) => i);
    expect(result).toEqual([]);
  });

  it("handles concurrency greater than item count without erroring", async () => {
    const result = await mapWithConcurrency([1, 2], 10, async (i) => i * 2);
    expect(result).toEqual([2, 4]);
  });
});
