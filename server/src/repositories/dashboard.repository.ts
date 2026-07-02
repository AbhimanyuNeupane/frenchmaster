import { prisma } from "../config/prisma";
import { startOfWeekMondayUtc, addDays } from "../utils/dateUtils";
import type { SkillKey } from "@prisma/client";

/**
 * All raw queries backing the dashboard aggregation. Kept separate from
 * DashboardService so query shape/indexing can be reasoned about (and
 * optimized/cached) independently of business logic.
 */
export const dashboardRepository = {
  findUserById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  },

  /** Most recently updated lesson with progress strictly between 1-99. */
  findContinueLesson(userId: string) {
    return prisma.lessonProgress.findFirst({
      where: { userId, progress: { gt: 0, lt: 100 } },
      orderBy: { updatedAt: "desc" },
      include: { lesson: { include: { unit: true } } },
    });
  },

  /**
   * Candidate lessons for "today's recommended lesson": lessons at the
   * user's current level with no progress row yet, ordered by unit/lesson
   * sequence so the recommendation follows curriculum order. This is a
   * placeholder for real adaptive-learning logic (see DashboardService).
   */
  findNextRecommendedLesson(userId: string, level: string) {
    return prisma.lesson.findFirst({
      where: {
        level: level as never,
        deletedAt: null,
        progressRecords: { none: { userId } },
      },
      orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
      include: { unit: true },
    });
  },

  findLessonProgressFor(userId: string, lessonId: string) {
    return prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  },

  findAllSkillScores(userId: string) {
    return prisma.skillScoreSnapshot.findMany({ where: { userId } });
  },

  /**
   * Aggregates mistake logs per topic: total attempts, mistakes, and
   * accuracy. Done in application code (not raw SQL) to stay within Prisma's
   * parameterized query API — avoids any hand-rolled SQL injection surface.
   */
  async findMistakeLogsForWeakTopics(userId: string) {
    return prisma.mistakeLog.findMany({
      where: { userId },
      select: { topicTitle: true, skillKey: true, correct: true },
    });
  },

  findDashboardAchievements(userId: string, limit: number) {
    return prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      // Highlights = unlocked-most-recent first, then highest-progress locked ones.
      orderBy: [{ unlockedAt: { sort: "desc", nulls: "last" } }, { progress: "desc" }],
      take: limit,
    });
  },

  /**
   * Upcoming published exam for the user's level, with each section's
   * question count — the service derives sectionsReady/sectionsTotal from
   * this (a section counts as "ready" once it has at least one question)
   * rather than a stored counter, now that real ExamSection/ExamQuestion
   * rows exist.
   */
  findUpcomingExamForLevel(level: string) {
    return prisma.exam.findFirst({
      where: { level: level as never, deletedAt: null, published: true },
      orderBy: { availableFrom: "asc" },
      include: {
        sections: { select: { _count: { select: { questions: true } } } },
      },
    });
  },

  /** Daily activity rows for the last 7 UTC days (Mon-Sun of the current week). */
  findDailyActivityThisWeek(userId: string, now: Date) {
    const monday = startOfWeekMondayUtc(now);
    const nextMonday = addDays(monday, 7);
    return prisma.dailyActivity.findMany({
      where: { userId, date: { gte: monday, lt: nextMonday } },
    });
  },

  findDailyActivityRange(userId: string, from: Date, to: Date) {
    return prisma.dailyActivity.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
  },

  findTodayActivity(userId: string, today: Date) {
    return prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });
  },

  sumXpForUser(userId: string) {
    return prisma.xpTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
  },

  sumXpEarnedSince(userId: string, since: Date) {
    return prisma.xpTransaction.aggregate({
      where: { userId, createdAt: { gte: since } },
      _sum: { amount: true },
    });
  },

  countVocabularyLearned(userId: string) {
    // Vocabulary "learned" = topics under the vocabulary skill with at least
    // one correct attempt and zero outstanding mistakes is too strict for a
    // placeholder metric; instead count distinct vocabulary topics attempted
    // at all. See DashboardService for the documented approximation.
    return prisma.mistakeLog.findMany({
      where: { userId, skillKey: "vocabulary" as SkillKey },
      select: { topicTitle: true },
      distinct: ["topicTitle"],
    });
  },
};
