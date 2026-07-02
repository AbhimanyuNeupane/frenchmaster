import { prisma } from "../config/prisma";

export const lessonRepository = {
  /** Course map: every unit, in order, with its lessons (title/order only — no content). */
  findUnitsWithLessons() {
    return prisma.unit.findMany({
      where: { deletedAt: null },
      orderBy: [{ level: "asc" }, { order: "asc" }],
      include: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          select: { id: true, title: true, subtitle: true, level: true, order: true, estimatedMinutes: true },
        },
      },
    });
  },

  /** A user's progress row for every lesson, for joining onto the course map. */
  findAllLessonProgressForUser(userId: string) {
    return prisma.lessonProgress.findMany({ where: { userId } });
  },

  /** Full lesson content — every section CLAUDE.md's Lesson Structure calls for. */
  findLessonWithContent(id: string) {
    return prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, title: true, level: true } },
        vocabularyLinks: {
          orderBy: { order: "asc" },
          include: { word: { include: { translations: true } } },
        },
        grammarPoints: {
          orderBy: { order: "asc" },
          include: { examples: { orderBy: { order: "asc" } } },
        },
        dialogues: {
          orderBy: { order: "asc" },
          include: { lines: { orderBy: { order: "asc" } } },
        },
        readingPassages: true,
        listeningClips: true,
        exercises: {
          orderBy: { order: "asc" },
        },
      },
    });
  },

  findLessonProgress(userId: string, lessonId: string) {
    return prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  },

  upsertLessonProgress(userId: string, lessonId: string, progress: number) {
    return prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { progress },
      create: { userId, lessonId, progress },
    });
  },

  findExerciseById(id: string) {
    return prisma.exercise.findUnique({
      where: { id },
      include: { lesson: { select: { id: true, title: true } } },
    });
  },

  createExerciseAttempt(data: {
    userId: string;
    exerciseId: string;
    submittedAnswer: string;
    isCorrect: boolean;
  }) {
    return prisma.exerciseAttempt.create({ data });
  },

  createMistakeLog(data: { userId: string; topicTitle: string; skillKey: string; correct: boolean }) {
    return prisma.mistakeLog.create({ data: data as never });
  },

  createXpTransaction(data: { userId: string; amount: number; reason: string }) {
    return prisma.xpTransaction.create({ data });
  },
};
