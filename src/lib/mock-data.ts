import type { DashboardData } from "@/types";

/**
 * Static fixture standing in for GET /api/dashboard.
 * Shape must stay in sync with docs/BACKEND_API_CONTRACT.md.
 */
export const mockDashboardData: DashboardData = {
  user: {
    id: "usr_1",
    name: "Camille",
    avatarUrl: null,
    currentLevel: "A2",
    levelProgress: 62,
    coins: 1240,
  },
  streak: {
    current: 12,
    longest: 34,
    goalMinutesPerDay: 15,
    minutesToday: 8,
    last7Days: [true, true, false, true, true, true, false],
  },
  xp: {
    total: 8420,
    todayEarned: 60,
    level: 14,
    xpIntoLevel: 320,
    xpForNextLevel: 500,
  },
  continueLesson: {
    id: "lsn_a2_u3_l2",
    title: "Ordering at a Café",
    subtitle: "Restaurant conversations, part 2",
    unitTitle: "Unit 3 · Eating Out",
    level: "A2",
    estimatedMinutes: 12,
    progress: 45,
  },
  todaysLesson: {
    id: "lsn_a2_u3_l3",
    title: "Asking for the Bill",
    subtitle: "Polite requests and numbers",
    unitTitle: "Unit 3 · Eating Out",
    level: "A2",
    estimatedMinutes: 10,
    progress: 0,
  },
  skillScores: [
    { key: "pronunciation", label: "Pronunciation", score: 78 },
    { key: "grammar", label: "Grammar", score: 64 },
    { key: "listening", label: "Listening", score: 71 },
    { key: "reading", label: "Reading", score: 82 },
    { key: "speaking", label: "Speaking", score: 58 },
    { key: "vocabulary", label: "Vocabulary", score: 88 },
  ],
  weakTopics: [
    {
      id: "wt_1",
      title: "Passé composé vs. imparfait",
      skill: "grammar",
      accuracy: 52,
      mistakeCount: 14,
    },
    {
      id: "wt_2",
      title: "Nasal vowel sounds (an, on, in)",
      skill: "pronunciation",
      accuracy: 61,
      mistakeCount: 9,
    },
    {
      id: "wt_3",
      title: "Numbers 70–99",
      skill: "vocabulary",
      accuracy: 66,
      mistakeCount: 7,
    },
  ],
  achievements: [
    {
      id: "ach_1",
      title: "7 Day Streak",
      description: "Studied 7 days in a row",
      icon: "flame",
      unlockedAt: "2026-06-20T00:00:00.000Z",
      progress: 100,
    },
    {
      id: "ach_2",
      title: "Perfect Pronunciation",
      description: "Score 100% on a pronunciation drill",
      icon: "mic",
      unlockedAt: "2026-06-25T00:00:00.000Z",
      progress: 100,
    },
    {
      id: "ach_3",
      title: "Vocabulary Master",
      description: "Learn 500 words",
      icon: "book",
      unlockedAt: null,
      progress: 74,
    },
    {
      id: "ach_4",
      title: "30 Day Streak",
      description: "Studied 30 days in a row",
      icon: "trophy",
      unlockedAt: null,
      progress: 40,
    },
  ],
  upcomingExam: {
    id: "exam_a2",
    level: "A2",
    title: "A2 Certification Exam",
    availableFrom: "2026-07-15T00:00:00.000Z",
    sectionsReady: 5,
    sectionsTotal: 7,
  },
  studyTimeMinutesThisWeek: 186,
  vocabularyLearned: 372,
};
