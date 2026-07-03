import type { Translation } from "@/types/language";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2";

export type SkillKey =
  | "pronunciation"
  | "grammar"
  | "listening"
  | "reading"
  | "speaking"
  | "vocabulary";

export interface SkillScore {
  key: SkillKey;
  label: string;
  score: number; // 0-100
}

export interface StreakInfo {
  current: number;
  longest: number;
  goalMinutesPerDay: number;
  minutesToday: number;
  last7Days: boolean[]; // true = goal met that day
}

export interface XpSummary {
  total: number;
  todayEarned: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  subtitle: string;
  unitTitle: string;
  level: CEFRLevel;
  estimatedMinutes: number;
  progress: number; // 0-100, 0 = not started
}

export interface WeakTopic {
  id: string;
  title: string;
  skill: SkillKey;
  accuracy: number; // 0-100
  mistakeCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: "flame" | "mic" | "trophy" | "book" | "target" | "medal";
  unlockedAt: string | null; // ISO date, null = locked
  progress: number; // 0-100
}

export interface UpcomingExam {
  id: string;
  level: CEFRLevel;
  title: string;
  availableFrom: string; // ISO date
  sectionsReady: number;
  sectionsTotal: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  currentLevel: CEFRLevel;
  levelProgress: number; // 0-100 through current level
  coins: number;
}

export interface DashboardData {
  user: UserProfile;
  streak: StreakInfo;
  xp: XpSummary;
  continueLesson: LessonSummary;
  todaysLesson: LessonSummary;
  skillScores: SkillScore[];
  weakTopics: WeakTopic[];
  achievements: Achievement[];
  upcomingExam: UpcomingExam | null;
  studyTimeMinutesThisWeek: number;
  vocabularyLearned: number;
}

export type WordGender = "masculine" | "feminine" | "neutral";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrase"
  | "expression";

export type MasteryStatus = "new" | "learning" | "mastered";

export interface VocabularyWord {
  id: string;
  french: string;
  english: string;
  /**
   * The user's primary-language translation, or null when their primary
   * language is English or no translation exists yet. The backend encodes
   * the "skip if English" rule — render conditionally on this being non-null.
   */
  nativeTranslation: Translation | null;
  gender: WordGender | null; // null for non-nouns
  partOfSpeech: PartOfSpeech;
  pronunciationIpa: string;
  audioUrl: string | null; // null until TTS pipeline exists
  exampleFr: string;
  exampleEn: string;
  imageUrl: string | null;
  synonyms: string[];
  commonMistake: string | null;
  level: CEFRLevel;
  unitTitle: string; // category grouping, e.g. "Greetings", "Food"
  isFavorite: boolean;
  masteryStatus: MasteryStatus;
  lastReviewedAt: string | null; // ISO date
}

export interface VocabularyStats {
  total: number;
  mastered: number;
  favorites: number;
  dueForReview: number;
}

export interface VocabularyListResponse {
  words: VocabularyWord[];
  stats: VocabularyStats;
}

export type NavKey =
  | "dashboard"
  | "learn"
  | "courses"
  | "vocabulary"
  | "grammar"
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "practice"
  | "exam"
  | "achievements"
  | "certificates"
  | "progress"
  | "settings"
  | "profile";
