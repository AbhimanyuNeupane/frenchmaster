/**
 * XP leveling curve.
 *
 * DECISION (needs human sign-off — flagged in project report): using a
 * simple quadratic curve, the same shape Duolingo-style apps commonly use:
 *
 *   xpRequiredForLevel(n) = 100 * n^2   (total cumulative XP to REACH level n+1,
 *                                        i.e. xpRequiredForLevel(0) is the
 *                                        threshold to go from level 1 -> 2)
 *
 * Concretely, cumulative XP thresholds to complete level N (1-indexed):
 *   Level 1 -> 2:  100 * 1^2 = 100
 *   Level 2 -> 3:  100 * 2^2 = 400   (cumulative 500)
 *   Level 3 -> 4:  100 * 3^2 = 900   (cumulative 1400)
 *   ...
 *
 * This gives a gently accelerating curve (each level takes longer than the
 * last) without becoming punishing. It is intentionally simple and easy to
 * tune later (designers may want a different curve once real engagement
 * data exists) — isolated here as the single place that would change.
 */

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

function xpCostForLevel(level: number): number {
  // XP required to go from `level` to `level + 1`.
  return 100 * level * level;
}

export function computeLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  // Walk up levels while the user has enough cumulative XP to clear them.
  // Bounded loop (XP is finite in practice) — safe for dashboard-scale reads.
  let cost = xpCostForLevel(level);
  while (remaining >= cost) {
    remaining -= cost;
    level += 1;
    cost = xpCostForLevel(level);
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: cost,
  };
}
