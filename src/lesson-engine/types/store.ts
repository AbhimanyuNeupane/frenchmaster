/**
 * The lesson-session state shape held by the Zustand store. These are exactly
 * the fields enumerated in ARCHITECTURE.md's State Management section. The store
 * has no knowledge of persistence — persistence subscribes to it externally.
 */
export interface LessonSessionState {
  /** Index of the active card within the current lesson. */
  currentCard: number;
  /** Ids of cards the learner has completed. */
  completedCards: string[];
  correctAnswers: number;
  wrongAnswers: number;
  xp: number;
  hearts: number;
  lives: number;
  quizScore: number;
  speakingAttempts: number;
  completionPercentage: number;
  currentLesson: string | null;
  currentCourse: string | null;
  currentSection: string | null;
  currentLanguage: string | null;
}
