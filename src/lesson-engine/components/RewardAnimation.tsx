"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Sparkles } from "lucide-react";

/**
 * Lesson-completion celebration. A spring pop on the trophy plus a burst of
 * confetti dots; collapses to a static layout when prefers-reduced-motion.
 */
export function RewardAnimation({
  title,
  message,
  xp,
  badge,
}: {
  title: string;
  message: string;
  xp?: number;
  badge?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center gap-4 py-6 text-center">
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute top-1/3 left-1/2 h-2 w-2 rounded-full"
              style={{
                backgroundColor: ["#FF7A59", "#22C55E", "#1F3B64", "#F59E0B"][
                  i % 4
                ],
              }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: (i - 7) * 22,
                y: [0, -60 - (i % 5) * 12, 40],
              }}
              transition={{ duration: 1.1, delay: i * 0.03, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={reduce ? false : { scale: 0.3, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent"
      >
        <Award className="h-10 w-10" />
      </motion.div>

      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="max-w-sm text-muted-foreground">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {typeof xp === "number" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-4 py-1.5 font-semibold text-success">
            <Sparkles className="h-4 w-4" />+{xp} XP
          </span>
        )}
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/10 px-4 py-1.5 font-semibold text-navy">
            <Award className="h-4 w-4" />
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
