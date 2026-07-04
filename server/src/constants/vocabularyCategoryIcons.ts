/**
 * Curated icon-name allowlist for vocabulary category presentation
 * (VocabularyCategoryMeta.icon). Deliberately a closed set, not freeform
 * text — an admin picks from these, so a category can never end up
 * referencing an icon that doesn't exist on the frontend. The frontend's
 * `CATEGORY_ICON_MAP` (src/components/vocabulary/vocabulary-category-grid.tsx)
 * must keep the exact same key set; this is the single source of truth both
 * sides are kept in sync with.
 */
export const VOCABULARY_CATEGORY_ICONS = [
  "hand",
  "help-circle",
  "users",
  "zap",
  "hash",
  "calendar-days",
  "clock",
  "palette",
  "home",
  "utensils-crossed",
  "map-pin",
  "sparkles",
  "person-standing",
  "package",
  "book-open",
  "globe",
  "star",
  "heart",
  "music",
  "tag",
] as const;

export type VocabularyCategoryIcon = (typeof VOCABULARY_CATEGORY_ICONS)[number];

export const DEFAULT_VOCABULARY_CATEGORY_ICON: VocabularyCategoryIcon = "tag";
