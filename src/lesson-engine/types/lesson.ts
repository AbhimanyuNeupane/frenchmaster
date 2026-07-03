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
  /**
   * Content-gating flag from the auth-aware public API: `true` means the lesson
   * exists but the current requester (anonymous, or an under-privileged role)
   * can't play it yet. Absent/`false` = freely playable. The lesson is still
   * listed either way — gating blocks playing, never discovery.
   */
  locked?: boolean;
}
