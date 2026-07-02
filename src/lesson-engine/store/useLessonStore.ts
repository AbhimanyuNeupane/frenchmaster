"use client";

import { create } from "zustand";
import type { LessonSessionState } from "../types";

const INITIAL_HEARTS = 5;
const INITIAL_LIVES = 3;

/** Fields that reset at the start of every lesson (progress/score), keeping the
 *  session-level identity fields set separately by `startLesson`. */
const freshProgress = (): Pick<
  LessonSessionState,
  | "currentCard"
  | "completedCards"
  | "correctAnswers"
  | "wrongAnswers"
  | "xp"
  | "hearts"
  | "lives"
  | "quizScore"
  | "speakingAttempts"
  | "completionPercentage"
> => ({
  currentCard: 0,
  completedCards: [],
  correctAnswers: 0,
  wrongAnswers: 0,
  xp: 0,
  hearts: INITIAL_HEARTS,
  lives: INITIAL_LIVES,
  quizScore: 0,
  speakingAttempts: 0,
  completionPercentage: 0,
});

export interface LessonStoreActions {
  /** Begin a lesson: sets identity fields and resets all progress. */
  startLesson(input: {
    lessonId: string;
    language: string;
    courseId?: string | null;
    sectionId?: string | null;
  }): void;
  setCurrentCard(index: number): void;
  advanceCard(): void;
  goToPreviousCard(): void;
  markCardCompleted(cardId: string): void;
  recordCorrect(): void;
  recordWrong(): void;
  addXp(amount: number): void;
  loseHeart(): void;
  setQuizScore(score: number): void;
  incrementSpeakingAttempts(): void;
  setCompletionPercentage(pct: number): void;
  reset(): void;
}

export type LessonStore = LessonSessionState & LessonStoreActions;

const initialState: LessonSessionState = {
  ...freshProgress(),
  currentLesson: null,
  currentCourse: null,
  currentSection: null,
  currentLanguage: null,
};

export const useLessonStore = create<LessonStore>((set) => ({
  ...initialState,

  startLesson: ({ lessonId, language, courseId = null, sectionId = null }) =>
    set(() => ({
      ...freshProgress(),
      currentLesson: lessonId,
      currentLanguage: language,
      currentCourse: courseId,
      currentSection: sectionId,
    })),

  setCurrentCard: (index) => set(() => ({ currentCard: Math.max(0, index) })),

  advanceCard: () => set((s) => ({ currentCard: s.currentCard + 1 })),

  goToPreviousCard: () =>
    set((s) => ({ currentCard: Math.max(0, s.currentCard - 1) })),

  markCardCompleted: (cardId) =>
    set((s) =>
      s.completedCards.includes(cardId)
        ? s
        : { completedCards: [...s.completedCards, cardId] }
    ),

  recordCorrect: () => set((s) => ({ correctAnswers: s.correctAnswers + 1 })),

  recordWrong: () =>
    set((s) => ({
      wrongAnswers: s.wrongAnswers + 1,
      hearts: Math.max(0, s.hearts - 1),
    })),

  addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

  loseHeart: () => set((s) => ({ hearts: Math.max(0, s.hearts - 1) })),

  setQuizScore: (score) => set(() => ({ quizScore: score })),

  incrementSpeakingAttempts: () =>
    set((s) => ({ speakingAttempts: s.speakingAttempts + 1 })),

  setCompletionPercentage: (pct) =>
    set(() => ({ completionPercentage: Math.min(100, Math.max(0, pct)) })),

  reset: () => set(() => ({ ...initialState })),
}));
