"use client";

import { useLessonStore } from "../store/useLessonStore";
import type { LessonSessionState, PersistenceProvider } from "../types";
import { LocalStorageProvider } from "./localStorageProvider";
import { PERSISTENCE_KEY } from "./types";

const SESSION_KEYS: (keyof LessonSessionState)[] = [
  "currentCard",
  "completedCards",
  "correctAnswers",
  "wrongAnswers",
  "xp",
  "hearts",
  "lives",
  "quizScore",
  "speakingAttempts",
  "completionPercentage",
  "currentLesson",
  "currentCourse",
  "currentSection",
  "currentLanguage",
];

function pickSession(state: LessonSessionState): LessonSessionState {
  const out = {} as LessonSessionState;
  for (const key of SESSION_KEYS) {
    // @ts-expect-error index assignment across the union of value types
    out[key] = state[key];
  }
  return out;
}

/**
 * Opt-in wiring that connects the store to a PersistenceProvider. The engine
 * works whether or not this is ever called — the store never reaches out for
 * persistence itself. Call this ONCE at the app root (the demo layout does).
 *
 * Hydrates the store from the last saved session, then subscribes to store
 * changes and writes them back (debounced). Returns a detach function.
 */
export function attachPersistence(options?: {
  provider?: PersistenceProvider;
  key?: string;
  debounceMs?: number;
}): () => void {
  const provider = options?.provider ?? new LocalStorageProvider();
  const key = options?.key ?? PERSISTENCE_KEY;
  const debounceMs = options?.debounceMs ?? 500;

  let detached = false;

  // Hydrate (fire-and-forget; hydration racing an in-progress lesson is fine —
  // startLesson only resets when the lesson id differs).
  void provider.load<LessonSessionState>(key).then((saved) => {
    if (saved && !detached) {
      useLessonStore.setState(saved);
    }
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = useLessonStore.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void provider.save(key, pickSession(state));
    }, debounceMs);
  });

  return () => {
    detached = true;
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
