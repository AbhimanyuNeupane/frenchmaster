import { dashboardRepository } from "../repositories/dashboard.repository";
import { ApiError } from "../utils/ApiError";
import { computeLevelInfo } from "../utils/xpCurve";
import { addDays, startOfTodayUtc, startOfWeekMondayUtc } from "../utils/dateUtils";
import type { SkillKey as PrismaSkillKey } from "@prisma/client";

/**
 * The six fixed skill keys the frontend always expects, in display order.
 * See docs/BACKEND_API_CONTRACT.md: "the frontend expects all six keys
 * present every time so it can render fixed rows without conditional logic."
 */
const SKILL_KEYS: { key: PrismaSkillKey; label: string }[] = [
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
  { key: "vocabulary", label: "Vocabulary" },
];

const DASHBOARD_ACHIEVEMENT_LIMIT = 4;
const WEAK_TOPIC_LIMIT = 5;
const MIN_ATTEMPTS_FOR_WEAK_TOPIC = 3; // avoid flagging a topic off one lucky/unlucky attempt

function toLessonSummary(
  lesson: {
    id: string;
    title: string;
    subtitle: string;
    level: string;
    estimatedMinutes: number;
    unit: { title: string };
  },
  progress: number
) {
  return {
    id: lesson.id,
    title: lesson.title,
    subtitle: lesson.subtitle,
    unitTitle: lesson.unit.title,
    level: lesson.level,
    estimatedMinutes: lesson.estimatedMinutes,
    progress,
  };
}

export const dashboardService = {
  async getDashboard(userId: string) {
    const user = await dashboardRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const today = startOfTodayUtc();
    const now = new Date();

    const [
      continueLessonRow,
      skillScoreRows,
      mistakeLogs,
      dashboardAchievements,
      upcomingExamRow,
      xpTotalAgg,
      xpTodayAgg,
      weekActivity,
      todayActivity,
      vocabTopics,
    ] = await Promise.all([
      dashboardRepository.findContinueLesson(userId),
      dashboardRepository.findAllSkillScores(userId),
      dashboardRepository.findMistakeLogsForWeakTopics(userId),
      dashboardRepository.findDashboardAchievements(userId, DASHBOARD_ACHIEVEMENT_LIMIT),
      dashboardRepository.findUpcomingExamForLevel(user.currentLevel),
      dashboardRepository.sumXpForUser(userId),
      dashboardRepository.sumXpEarnedSince(userId, today),
      dashboardRepository.findDailyActivityThisWeek(userId, now),
      dashboardRepository.findTodayActivity(userId, today),
      dashboardRepository.countVocabularyLearned(userId),
    ]);

    // --- todaysLesson: next recommended lesson at the user's level ---
    // PLACEHOLDER for real adaptive-learning logic (CLAUDE.md "Adaptive
    // Learning" — recommend easier lesson / review / pronunciation / grammar
    // / listening when a user is struggling). Today this is simply "the
    // next not-yet-started lesson in curriculum order for the user's
    // current CEFR level." A real implementation would weigh skillScores
    // and weakTopics (e.g. prioritize a lesson tagged with the user's
    // weakest skill) — flagged as future work.
    const todaysLessonRow = await dashboardRepository.findNextRecommendedLesson(
      userId,
      user.currentLevel
    );

    // --- streak ---
    const streak = await this.computeStreak(userId, user.goalMinutesPerDay, today, now);

    // --- xp ---
    const totalXp = xpTotalAgg._sum.amount ?? 0;
    const todayEarned = xpTodayAgg._sum.amount ?? 0;
    const levelInfo = computeLevelInfo(totalXp);

    // --- skill scores: always all 6 keys, default 0 if no snapshot yet ---
    const scoreByKey = new Map(skillScoreRows.map((row) => [row.skillKey, row.score]));
    const skillScores = SKILL_KEYS.map(({ key, label }) => ({
      key,
      label,
      score: scoreByKey.get(key) ?? 0,
    }));

    // --- weak topics: aggregate mistakes per topic, worst accuracy first ---
    const weakTopics = this.computeWeakTopics(mistakeLogs);

    // --- study time this week (Mon-Sun UTC) ---
    const studyTimeMinutesThisWeek = weekActivity.reduce((sum, row) => sum + row.minutesStudied, 0);

    return {
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        currentLevel: user.currentLevel,
        levelProgress: user.levelProgress,
        coins: user.coins,
      },
      streak: {
        current: streak.current,
        longest: streak.longest,
        goalMinutesPerDay: user.goalMinutesPerDay,
        minutesToday: todayActivity?.minutesStudied ?? 0,
        last7Days: streak.last7Days,
      },
      xp: {
        total: totalXp,
        todayEarned,
        level: levelInfo.level,
        xpIntoLevel: levelInfo.xpIntoLevel,
        xpForNextLevel: levelInfo.xpForNextLevel,
      },
      continueLesson: continueLessonRow
        ? toLessonSummary(continueLessonRow.lesson, continueLessonRow.progress)
        : this.emptyLessonSummary(user.currentLevel),
      todaysLesson: todaysLessonRow
        ? toLessonSummary(todaysLessonRow, 0)
        : this.emptyLessonSummary(user.currentLevel),
      skillScores,
      weakTopics,
      achievements: dashboardAchievements.map((ua) => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt ? ua.unlockedAt.toISOString() : null,
        progress: ua.progress,
      })),
      upcomingExam: upcomingExamRow
        ? {
            id: upcomingExamRow.id,
            level: upcomingExamRow.level,
            title: upcomingExamRow.title,
            availableFrom: upcomingExamRow.availableFrom.toISOString(),
            sectionsReady: upcomingExamRow.sectionsReady,
            sectionsTotal: upcomingExamRow.sectionsTotal,
          }
        : null,
      studyTimeMinutesThisWeek,
      vocabularyLearned: vocabTopics.length,
    };
  },

  /**
   * Fallback lesson summary for a brand-new user/level with no seeded
   * curriculum content yet, so the endpoint never 500s or returns undefined
   * fields the frontend isn't typed to handle as optional.
   */
  emptyLessonSummary(level: string) {
    return {
      id: "",
      title: "No lessons available yet",
      subtitle: "",
      unitTitle: "",
      level,
      estimatedMinutes: 0,
      progress: 0,
    };
  },

  /**
   * Aggregates raw mistake-log rows into per-topic accuracy, filters out
   * topics with too few attempts to be meaningful, sorts worst-accuracy
   * first (ties broken by higher mistake count), and caps the result.
   */
  computeWeakTopics(
    logs: { topicTitle: string; skillKey: PrismaSkillKey; correct: boolean }[]
  ) {
    const byTopic = new Map<
      string,
      { skill: PrismaSkillKey; attempts: number; mistakes: number }
    >();

    for (const log of logs) {
      const existing = byTopic.get(log.topicTitle) ?? {
        skill: log.skillKey,
        attempts: 0,
        mistakes: 0,
      };
      existing.attempts += 1;
      if (!log.correct) existing.mistakes += 1;
      byTopic.set(log.topicTitle, existing);
    }

    return Array.from(byTopic.entries())
      .map(([title, stats], index) => ({
        id: `wt_${index}_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        title,
        skill: stats.skill,
        accuracy: Math.round(((stats.attempts - stats.mistakes) / stats.attempts) * 100),
        mistakeCount: stats.mistakes,
      }))
      .filter((t) => t.mistakeCount > 0 && byTopic.get(t.title)!.attempts >= MIN_ATTEMPTS_FOR_WEAK_TOPIC)
      .sort((a, b) => a.accuracy - b.accuracy || b.mistakeCount - a.mistakeCount)
      .slice(0, WEAK_TOPIC_LIMIT);
  },

  /**
   * Computes current streak, longest streak, and the Mon-Sun "goal met"
   * boolean array for the current week, all from `DailyActivity` rows.
   *
   * - `current`: consecutive UTC days (ending today or yesterday — a miss
   *   only breaks the streak once a full day has elapsed with no activity
   *   meeting the goal) with minutesStudied >= goalMinutesPerDay.
   * - `longest`: longest such run in the user's history.
   * - `last7Days`: Mon->Sun of the CURRENT week (per contract: "oldest to
   *   newest (Mon -> Sun in the mock)"), true if goal met that day. Days in
   *   the current week that haven't happened yet are `false`.
   */
  async computeStreak(userId: string, goalMinutesPerDay: number, today: Date, now: Date) {
    // Look back far enough to compute a meaningful longest-streak without
    // scanning the entire history table on every dashboard load. 400 days
    // comfortably covers "30 day streak" style achievements plus margin.
    const lookbackStart = addDays(today, -400);
    const activity = await dashboardRepository.findDailyActivityRange(userId, lookbackStart, today);

    const metGoalByDate = new Map<string, boolean>();
    for (const row of activity) {
      metGoalByDate.set(row.date.toISOString().slice(0, 10), row.minutesStudied >= goalMinutesPerDay);
    }

    const metGoal = (d: Date) => metGoalByDate.get(d.toISOString().slice(0, 10)) ?? false;

    // Current streak: walk backwards from today. If today's goal isn't met
    // yet (user just hasn't studied today), that alone shouldn't zero out
    // an otherwise-live streak, so we start from yesterday in that case.
    let cursor = metGoal(today) ? today : addDays(today, -1);
    let current = 0;
    while (metGoal(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }

    // Longest streak across the lookback window.
    let longest = 0;
    let running = 0;
    for (let d = lookbackStart; d.getTime() <= today.getTime(); d = addDays(d, 1)) {
      if (metGoal(d)) {
        running += 1;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    }
    longest = Math.max(longest, current);

    // last7Days: Mon -> Sun of the current week.
    const monday = startOfWeekMondayUtc(now);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i);
      if (day.getTime() > today.getTime()) return false; // future day this week
      return metGoal(day);
    });

    return { current, longest, last7Days };
  },
};
