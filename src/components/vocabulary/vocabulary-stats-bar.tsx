import { BookMarked, Star, Sparkles, Clock } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import type { VocabularyStats } from "@/types";

export function VocabularyStatsBar({ stats }: { stats: VocabularyStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard icon={BookMarked} label="Total Words" value={`${stats.total}`} tone="navy" />
      <StatCard icon={Sparkles} label="Mastered" value={`${stats.mastered}`} tone="success" />
      <StatCard icon={Star} label="Favorites" value={`${stats.favorites}`} tone="warning" />
      <StatCard icon={Clock} label="Due for Review" value={`${stats.dueForReview}`} tone="accent" />
    </div>
  );
}
