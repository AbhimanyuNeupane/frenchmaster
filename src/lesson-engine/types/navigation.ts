/**
 * Public surface of the navigation engine. All positional state lives in the
 * Zustand store (not local component state) so navigation survives remounts and
 * is what gets persisted.
 */
export interface LessonNavigation {
  currentIndex: number;
  totalCards: number;
  isFirst: boolean;
  isLast: boolean;
  isComplete: boolean;
  progressPercent: number;
  /** Seconds; sums remaining cards' metadata.estimatedSeconds, degrading to a
   *  per-card-count estimate when metadata is absent. */
  estimatedTimeRemaining: number;
  next: () => void;
  previous: () => void;
  skip: () => void;
  restart: () => void;
  resume: () => void;
  exit: () => void;
}
