import type { CEFRLevel, PartOfSpeech, WordGender } from "@/types";

/**
 * Lesson-domain types mirroring the backend lesson API contract
 * (server/src/services/lesson.service.ts). These are intentionally distinct
 * from the Vocabulary feature's `VocabularyWord` type: a lesson's linked
 * words carry only the intrinsic word data, NOT the per-user
 * favorite/mastery fields the vocabulary endpoint joins in.
 */

export type ExerciseType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "arrange_sentence"
  | "match"
  | "audio_question"
  | "image_question"
  | "typing"
  | "speaking_prompt";

/** A word linked to a lesson — intrinsic data only (no user progress fields). */
export interface LessonVocabularyWord {
  id: string;
  french: string;
  english: string;
  gender: WordGender | null;
  partOfSpeech: PartOfSpeech;
  pronunciationIpa: string;
  audioUrl: string | null;
  exampleFr: string;
  exampleEn: string;
  imageUrl: string | null;
  synonyms: string[];
  commonMistake: string | null;
  level: CEFRLevel;
  unitTitle: string;
}

export interface GrammarExample {
  frenchText: string;
  englishText: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  /** Markdown (bold + bullet lists) — render via <Markdown />, never raw. */
  explanation: string;
  examples: GrammarExample[];
}

export interface DialogueLine {
  speaker: string;
  frenchText: string;
  englishText: string;
  audioUrl: string | null;
}

export interface Dialogue {
  id: string;
  title: string;
  context: string;
  lines: DialogueLine[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  bodyFr: string;
  bodyEn: string;
  audioUrl: string | null;
}

export interface ListeningClip {
  id: string;
  title: string;
  audioUrl: string | null;
  transcriptFr: string;
  transcriptEn: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  /** Choices for multiple_choice/true_false/match; empty for free-text types. */
  options: string[];
  audioUrl: string | null;
  imageUrl: string | null;
  points: number;
  // correctAnswer is intentionally NOT sent to the client — grading is
  // server-side. It's only revealed in an attempt's response for feedback.
}

export interface LessonContent {
  id: string;
  title: string;
  subtitle: string;
  level: CEFRLevel;
  estimatedMinutes: number;
  unit: { id: string; title: string; level: CEFRLevel };
  progress: number; // 0-100 for the current user
  vocabulary: LessonVocabularyWord[];
  grammarPoints: GrammarPoint[];
  dialogues: Dialogue[];
  readingPassages: ReadingPassage[];
  listeningClips: ListeningClip[];
  exercises: Exercise[];
}

/** GET /api/lessons/units — one entry per unit, lessons nested with progress. */
export interface CourseMapLesson {
  id: string;
  title: string;
  subtitle: string;
  level: CEFRLevel;
  order: number;
  estimatedMinutes: number;
  progress: number; // 0-100
}

export interface CourseMapUnit {
  id: string;
  title: string;
  description: string | null;
  level: CEFRLevel;
  order: number;
  lessons: CourseMapLesson[];
}

/** POST /api/lessons/exercises/:id/attempt response. */
export interface ExerciseAttemptResult {
  isCorrect: boolean;
  correctAnswer: string;
  lessonProgress: number;
}
