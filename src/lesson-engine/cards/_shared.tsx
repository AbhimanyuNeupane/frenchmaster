"use client";

/**
 * Internal, card-agnostic presentational helpers shared by the card components.
 * This file is NOT a card type and is intentionally never imported by
 * `cards/index.ts` — it registers nothing.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ValidationResult } from "../types";

export function CardFrame({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {(title || subtitle) && (
        <header className="flex flex-col gap-1">
          {title && (
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}

export function CheckButton({
  onClick,
  disabled,
  label = "Check",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button variant="accent" size="lg" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

export function FeedbackBanner({ result }: { result: ValidationResult }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-semibold",
        result.isCorrect
          ? "bg-success/15 text-success"
          : "bg-danger/15 text-danger"
      )}
    >
      {result.feedback ??
        (result.isCorrect ? "Correct!" : "Not quite — try reviewing this.")}
      {typeof result.score === "number" && (
        <span className="ml-2 font-normal opacity-80">
          Score: {Math.round(result.score)}
        </span>
      )}
    </div>
  );
}

/** Visual state classes for a selectable option, driven purely by props the
 *  engine supplies (selected / answered / correctness) — no card-type logic. */
export function optionStateClasses({
  selected,
  answered,
  isCorrectChoice,
}: {
  selected: boolean;
  answered: boolean;
  isCorrectChoice?: boolean;
}): string {
  if (answered && isCorrectChoice) {
    return "border-success bg-success/10 text-foreground";
  }
  if (answered && selected && !isCorrectChoice) {
    return "border-danger bg-danger/10 text-foreground";
  }
  if (selected) {
    return "border-accent bg-accent/10 text-foreground";
  }
  return "border-border bg-card text-foreground hover:border-accent/60";
}
