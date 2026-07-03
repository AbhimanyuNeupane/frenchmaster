"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Library } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Button } from "@/components/ui/button";
import { VocabularyStatsBar } from "@/components/vocabulary/vocabulary-stats-bar";
import { VocabularyFilters } from "@/components/vocabulary/vocabulary-filters";
import { VocabularyCard } from "@/components/vocabulary/vocabulary-card";
import { VocabularyCategoryGrid } from "@/components/vocabulary/vocabulary-category-grid";
import { VocabularyDetailDialog } from "@/components/vocabulary/vocabulary-detail-dialog";
import { useAuth } from "@/contexts/auth-context";
import type { CEFRLevel, VocabularyListResponse, VocabularyWord } from "@/types";

/** Preferred display order for well-known categories; anything else is appended
 *  alphabetically after these — new categories never need this list updated to
 *  show up, they just sort after the curated ones. */
const CATEGORY_ORDER = [
  "Greetings & Politeness",
  "Greetings",
  "Question Words",
  "Pronouns",
  "Common Verbs",
  "Numbers",
  "Days & Months",
  "Time & Dates",
  "Colors",
  "Family",
  "Food & Dining",
  "Places",
  "Adjectives",
  "Body Parts",
  "Everyday Objects",
];

function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function VocabularyExplorer({ initialData }: { initialData: VocabularyListResponse }) {
  const { authedFetch } = useAuth();
  const [words, setWords] = useState<VocabularyWord[]>(initialData.words);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<CEFRLevel | "all">("all");
  const [category, setCategory] = useState<string | "all">("all");
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
      if (category !== "all" && w.unitTitle !== category) return false;
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
  }, [words, search, level, category, favoritesOnly, dueOnly]);

  // The landing view is a grid of category tiles (never all 15 categories'
  // words stacked on one page) — tiles respect the Level filter but not
  // category/search/favorites/due, since picking a tile IS how you set
  // category. The moment any other filter is active (or a category is
  // already selected), show that filtered result set directly instead.
  const showCategoryTiles =
    category === "all" && !favoritesOnly && !dueOnly && search.trim() === "";

  const categoryTiles = useMemo(() => {
    const inLevel = level === "all" ? words : words.filter((w) => w.level === level);
    const counts = new Map<string, number>();
    for (const w of inLevel) counts.set(w.unitTitle, (counts.get(w.unitTitle) ?? 0) + 1);
    return sortCategories(Array.from(counts.keys())).map((title) => ({
      title,
      count: counts.get(title) ?? 0,
    }));
  }, [words, level]);

  const activeWord = words.find((w) => w.id === activeWordId) ?? null;

  async function toggleFavorite(id: string) {
    const previous = words;
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w))
    );
    try {
      const updated = await authedFetch<VocabularyWord>(`/api/vocabulary/${id}/favorite`, {
        method: "POST",
      });
      setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch {
      setWords(previous);
    }
  }

  async function markReviewed(id: string) {
    const previous = words;
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
    try {
      const updated = await authedFetch<VocabularyWord>(`/api/vocabulary/${id}/review`, {
        method: "POST",
      });
      setWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch {
      setWords(previous);
    }
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

      {showCategoryTiles ? (
        <Reveal delay={0.15}>
          <VocabularyCategoryGrid categories={categoryTiles} onSelect={setCategory} />
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.12}>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setCategory("all")}>
                <ArrowLeft className="size-3.5" />
                All categories
              </Button>
              {category !== "all" && (
                <h2 className="text-sm font-semibold text-navy">
                  {category}
                  <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                    {filteredWords.length}
                  </span>
                </h2>
              )}
            </div>
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
        </>
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
