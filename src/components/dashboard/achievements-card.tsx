import Link from "next/link";
import { ArrowRight, Flame, Mic, Trophy, Book, Target, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types";

const ICONS: Record<Achievement["icon"], LucideIcon> = {
  flame: Flame,
  mic: Mic,
  trophy: Trophy,
  book: Book,
  target: Target,
  medal: Medal,
};

export function AchievementsCard({ achievements }: { achievements: Achievement[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Achievements</CardTitle>
        <Link
          href="/achievements"
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((achievement) => {
            const Icon = ICONS[achievement.icon];
            const unlocked = Boolean(achievement.unlockedAt);
            return (
              <div
                key={achievement.id}
                className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center"
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    unlocked ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="size-6" strokeWidth={2} />
                </div>
                <p className="text-xs font-semibold leading-tight text-navy">
                  {achievement.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {unlocked ? "Unlocked" : `${achievement.progress}%`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
