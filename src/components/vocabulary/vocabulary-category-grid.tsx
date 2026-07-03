"use client";

import type { LucideIcon } from "lucide-react";
import {
  Hand,
  HelpCircle,
  Users,
  Zap,
  Hash,
  CalendarDays,
  Clock,
  Palette,
  Home,
  UtensilsCrossed,
  MapPin,
  Sparkles,
  PersonStanding,
  Package,
  Tag,
} from "lucide-react";

import { Card } from "@/components/ui/card";

/** Best-effort icon per known category name; anything unrecognized falls back
 *  to a generic tag icon so a brand-new category still renders sensibly. */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  "Greetings & Politeness": Hand,
  Greetings: Hand,
  "Question Words": HelpCircle,
  Pronouns: Users,
  "Common Verbs": Zap,
  Numbers: Hash,
  "Days & Months": CalendarDays,
  "Time & Dates": Clock,
  Colors: Palette,
  Family: Home,
  "Food & Dining": UtensilsCrossed,
  Places: MapPin,
  Adjectives: Sparkles,
  "Body Parts": PersonStanding,
  "Everyday Objects": Package,
};

export interface CategoryTileData {
  title: string;
  count: number;
}

/**
 * The default vocabulary landing view: one clickable tile per category
 * (never a flat list of every word at once). Picking a tile drills into that
 * category's words — see `VocabularyExplorer`, which swaps this grid out for
 * the filtered word grid once a category is selected.
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
        const Icon = CATEGORY_ICON[c.title] ?? Tag;
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
