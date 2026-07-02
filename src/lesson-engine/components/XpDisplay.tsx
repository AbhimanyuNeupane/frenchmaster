"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function XpDisplay({ xp }: { xp: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">
      <Sparkles className="h-4 w-4" />
      <motion.span
        key={xp}
        initial={reduce ? false : { scale: 1.4 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        {xp} XP
      </motion.span>
    </div>
  );
}
