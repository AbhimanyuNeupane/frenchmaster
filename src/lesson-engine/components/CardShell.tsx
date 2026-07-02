"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Framer Motion transition wrapper around whatever card is active. Slides/fades
 * on card change; respects prefers-reduced-motion by collapsing to a plain
 * fade. Card-agnostic — it knows nothing about card types.
 */
export function CardShell({
  children,
  direction = 1,
  className,
}: {
  children: React.ReactNode;
  /** 1 = moving forward, -1 = moving back. */
  direction?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const variants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: 40 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 * direction },
      };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <Card className={cn("p-6 sm:p-8", className)}>{children}</Card>
    </motion.div>
  );
}
