"use client";

import * as React from "react";
import { useLessonStore } from "../store/useLessonStore";
import type { Lesson, LessonNavigation } from "../types";

const DEFAULT_SECONDS_PER_CARD = 30;

/**
 * Navigation engine. All positional state lives in the Zustand store (not local
 * component state), so navigation survives remounts and is what persistence
 * captures. This hook is card-type agnostic: it only knows there is an ordered
 * list of cards and a current index.
 */
export function useLessonNavigation(
  lesson: Lesson | undefined,
  options?: { onExit?: () => void }
): LessonNavigation {
  const currentIndex = useLessonStore((s) => s.currentCard);
  const setCurrentCard = useLessonStore((s) => s.setCurrentCard);
  const advanceCard = useLessonStore((s) => s.advanceCard);
  const goToPreviousCard = useLessonStore((s) => s.goToPreviousCard);
  const setCompletionPercentage = useLessonStore((s) => s.setCompletionPercentage);

  const cards = lesson?.cards ?? [];
  const totalCards = cards.length;
  const isComplete = totalCards > 0 && currentIndex >= totalCards;
  const isFirst = currentIndex <= 0;
  const isLast = totalCards > 0 && currentIndex === totalCards - 1;

  const progressPercent =
    totalCards === 0
      ? 0
      : Math.min(100, Math.round((currentIndex / totalCards) * 100));

  const estimatedTimeRemaining = React.useMemo(() => {
    if (totalCards === 0) return 0;
    const remaining = cards.slice(Math.min(currentIndex, totalCards));
    return remaining.reduce(
      (sum, c) => sum + (c.metadata?.estimatedSeconds ?? DEFAULT_SECONDS_PER_CARD),
      0
    );
  }, [cards, currentIndex, totalCards]);

  // Keep the store's completionPercentage in sync as the index moves.
  React.useEffect(() => {
    setCompletionPercentage(progressPercent);
  }, [progressPercent, setCompletionPercentage]);

  const next = React.useCallback(() => {
    if (totalCards === 0) return;
    if (currentIndex < totalCards) advanceCard();
  }, [advanceCard, currentIndex, totalCards]);

  const previous = React.useCallback(() => {
    goToPreviousCard();
  }, [goToPreviousCard]);

  const skip = React.useCallback(() => {
    // Skipping is advancing without recording an answer; the store's answer
    // counters are driven by the renderer, not here.
    if (currentIndex < totalCards) advanceCard();
  }, [advanceCard, currentIndex, totalCards]);

  const restart = React.useCallback(() => {
    setCurrentCard(0);
  }, [setCurrentCard]);

  const resume = React.useCallback(() => {
    // Clamp any persisted index back into range for the current lesson.
    if (totalCards > 0 && currentIndex > totalCards) setCurrentCard(totalCards);
  }, [currentIndex, setCurrentCard, totalCards]);

  const exit = React.useCallback(() => {
    options?.onExit?.();
  }, [options]);

  return {
    currentIndex,
    totalCards,
    isFirst,
    isLast,
    isComplete,
    progressPercent,
    estimatedTimeRemaining,
    next,
    previous,
    skip,
    restart,
    resume,
    exit,
  };
}
