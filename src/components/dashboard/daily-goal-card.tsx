"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StreakInfo } from "@/types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function DailyGoalCard({ streak }: { streak: StreakInfo }) {
  const pct = Math.min(100, Math.round((streak.minutesToday / streak.goalMinutesPerDay) * 100));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Goal</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative flex size-28 shrink-0 items-center justify-center">
          <svg viewBox="0 0 108 108" className="size-28 -rotate-90">
            <circle
              cx="54"
              cy="54"
              r={radius}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="10"
            />
            <motion.circle
              cx="54"
              cy="54"
              r={radius}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-lg font-bold text-navy">{streak.minutesToday}</span>
            <span className="text-[11px] text-muted-foreground">
              / {streak.goalMinutesPerDay} min
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-navy">
              {pct >= 100 ? "Goal complete" : `${streak.goalMinutesPerDay - streak.minutesToday} min to go`}
            </p>
            <p className="text-xs text-muted-foreground">Keep your streak alive today</p>
          </div>
          <div className="flex w-full items-center justify-between">
            {streak.last7Days.map((met, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    met
                      ? "bg-success/15 text-success"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {DAY_LABELS[i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
