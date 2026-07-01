"use client";

import { useMemo, useState } from "react";
import { Library } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { VocabularyStatsBar } from "@/components/vocabulary/vocabulary-stats-bar";
import { VocabularyFilters } from "@/components/vocabulary/vocabulary-filters";
import { VocabularyCard } from "@/components/vocabulary/vocabulary-card";
import { VocabularyDetailDialog } from "@/components/vocabulary/vocabulary-detail-dialog";
import type { CEFRLevel, VocabularyListResponse, VocabularyWord } from "@/types";

export function VocabularyExplorer({ initialData }: { initialData: VocabularyListResponse }) {
  const [words, setWords] = useState<VocabularyWord[]>(initialData.words);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<CEFRLevel | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: words.length,
      mastered: words.filter((w) => w.masteryStatus === "mastered").length,
      favorites: words.filter((w) => w.isFavorite).length,
      dueForReview: words.filter((w) => w.masteryStatus !== "mastered").length,
    }),
    [words]
  );

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return words.filter((w) => {
      if (level !== "all" && w.level !== level) return false;
      if (favoritesOnly && !w.isFavorite) return false;
      if (dueOnly && w.masteryStatus === "mastered") return false;
      if (
        query &&
        !w.french.toLowerCase().includes(query) &&
        !w.english.toLowerCase().includes(query) &&
        !w.unitTitle.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [words, search, level, favoritesOnly, dueOnly]);

  const activeWord = words.find((w) => w.id === activeWordId) ?? null;

  function toggleFavorite(id: string) {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w))
    );
  }

  function markReviewed(id: string) {
    setWords((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              masteryStatus: w.masteryStatus === "new" ? "learning" : "mastered",
              lastReviewedAt: new Date().toISOString(),
            }
          : w
      )
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Vocabulary
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse, favorite, and review the words you&apos;ve learned so far.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <VocabularyStatsBar stats={stats} />
      </Reveal>

      <Reveal delay={0.1}>
        <VocabularyFilters
          search={search}
          onSearchChange={setSearch}
          level={level}
          onLevelChange={setLevel}
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyChange={setFavoritesOnly}
          dueOnly={dueOnly}
          onDueOnlyChange={setDueOnly}
        />
      </Reveal>

      {filteredWords.length > 0 ? (
        <Reveal delay={0.15}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWords.map((word) => (
              <VocabularyCard
                key={word.id}
                word={word}
                onOpen={() => setActiveWordId(word.id)}
                onToggleFavorite={() => toggleFavorite(word.id)}
              />
            ))}
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.15}>
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Library className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-navy">No words match your filters</p>
            <p className="text-xs text-muted-foreground">
              Try clearing the search or filters above.
            </p>
          </div>
        </Reveal>
      )}

      <VocabularyDetailDialog
        word={activeWord}
        open={activeWordId !== null}
        onOpenChange={(open) => !open && setActiveWordId(null)}
        onToggleFavorite={toggleFavorite}
        onMarkReviewed={markReviewed}
      />
    </div>
  );
}
