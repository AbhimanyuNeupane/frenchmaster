"use client";

import { Search, Star, Clock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CEFRLevel } from "@/types";

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-navy bg-navy text-white"
          : "border-border bg-card text-muted-foreground hover:border-navy/30 hover:text-navy"
      )}
    >
      {children}
    </button>
  );
}

export function VocabularyFilters({
  search,
  onSearchChange,
  level,
  onLevelChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  dueOnly,
  onDueOnlyChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  level: CEFRLevel | "all";
  onLevelChange: (value: CEFRLevel | "all") => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  dueOnly: boolean;
  onDueOnlyChange: (value: boolean) => void;
}) {
  // Category is no longer a chip row here — it's browsed via the category
  // tile grid on the page itself (see VocabularyCategoryGrid), which drills
  // into one category at a time instead of listing every category as a chip.
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search words, meanings, or categories..."
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={level === "all"} onClick={() => onLevelChange("all")}>
          All Levels
        </Chip>
        {LEVELS.map((l) => (
          <Chip key={l} active={level === l} onClick={() => onLevelChange(l)}>
            {l}
          </Chip>
        ))}

        <span className="mx-1 h-5 w-px bg-border" />

        <Chip active={favoritesOnly} onClick={() => onFavoritesOnlyChange(!favoritesOnly)}>
          <Star className={cn("size-3.5", favoritesOnly && "fill-current")} />
          Favorites
        </Chip>
        <Chip active={dueOnly} onClick={() => onDueOnlyChange(!dueOnly)}>
          <Clock className="size-3.5" />
          Due for Review
        </Chip>
      </div>
    </div>
  );
}
