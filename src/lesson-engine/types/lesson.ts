import type { LessonCard } from "./card";

/** Matches the spec's Lesson shape: { id, language, level, title, cards: [] }. */
export interface Lesson {
  id: string;
  language: string;
  level: string;
  title: string;
  description?: string;
  cards: LessonCard[];
  metadata?: {
    estimatedMinutes?: number;
    xpReward?: number;
    [key: string]: unknown;
  };
}

/** Lightweight lesson descriptor for pickers/lists (no card payload). */
export interface LessonSummary {
  id: string;
  language: string;
  level: string;
  title: string;
  description?: string;
  cardCount?: number;
}
