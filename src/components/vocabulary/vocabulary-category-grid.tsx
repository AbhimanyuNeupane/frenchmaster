"use client";

import { Card } from "@/components/ui/card";
import { resolveCategoryIcon } from "@/lib/vocabulary-category-icons";

export interface CategoryTileData {
  title: string;
  count: number;
  /** Admin-controlled icon-name string (see lib/vocabulary-category-icons.ts) — never hardcoded per category name in this component. */
  icon: string;
}

/**
 * The default vocabulary landing view: one clickable tile per category
 * (never a flat list of every word at once). Picking a tile drills into that
 * category's words — see `VocabularyExplorer`, which swaps this grid out for
 * the filtered word grid once a category is selected. Icon + ordering are
 * admin-controlled (fetched from `GET /api/vocabulary/categories`), not
 * hardcoded here — see the admin Vocabulary Categories manager.
 */
export function VocabularyCategoryGrid({
  categories,
  onSelect,
}: {
  categories: CategoryTileData[];
  onSelect: (title: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => {
        const Icon = resolveCategoryIcon(c.icon);
        return (
          <Card
            key={c.title}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(c.title)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(c.title);
            }}
            className="group flex cursor-pointer flex-col items-start gap-3 p-5 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="font-semibold text-navy">{c.title}</h3>
              <p className="text-xs text-muted-foreground">
                {c.count} {c.count === 1 ? "word" : "words"}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
