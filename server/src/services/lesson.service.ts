import { lessonRepository } from "../repositories/lesson.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../config/prisma";
import { resolveVocabularyTranslation } from "../utils/vocabularyTranslation";
import type { SkillKey } from "@prisma/client";

/** Normalizes free-text answers for exact-match grading (trim, case, accents-insensitive-ish via lowercasing). */
function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const XP_PER_CORRECT_ANSWER = 10;

export const lessonService = {
  /** Course map: every unit/lesson with the user's per-lesson progress joined in. */
  async getCourseMap(userId: string) {
    const [units, progressRows] = await Promise.all([
      lessonRepository.findUnitsWithLessons(),
      lessonRepository.findAllLessonProgressForUser(userId),
    ]);
    const progressByLessonId = new Map(progressRows.map((p) => [p.lessonId, p.progress]));

    return units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      level: unit.level,
      order: unit.order,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        progress: progressByLessonId.get(lesson.id) ?? 0,
      })),
    }));
  },

  /**
   * Full lesson content (vocabulary, grammar, conversation, reading,
   * listening, exercises) plus the requesting user's own progress on it —
   * everything a lesson-player UI needs in one call.
   */
  async getLessonContent(userId: string, lessonId: string) {
    const [lesson, progress, user] = await Promise.all([
      lessonRepository.findLessonWithContent(lessonId),
      lessonRepository.findLessonProgress(userId, lessonId),
      userRepository.findById(userId),
    ]);

    if (!lesson) {
      throw ApiError.notFound("Lesson not found");
    }

    const primaryLanguageCode = user?.primaryLanguageCode ?? "en";

    return {
      id: lesson.id,
      title: lesson.title,
      subtitle: lesson.subtitle,
      level: lesson.level,
      estimatedMinutes: lesson.estimatedMinutes,
      unit: lesson.unit,
      progress: progress?.progress ?? 0,
      vocabulary: lesson.vocabularyLinks.map((link) => {
        const { english, nativeTranslation } = resolveVocabularyTranslation(
          link.word.translations,
          primaryLanguageCode
        );
        return {
          id: link.word.id,
          french: link.word.french,
          english,
          nativeTranslation,
          gender: link.word.gender,
          partOfSpeech: link.word.partOfSpeech,
          pronunciationIpa: link.word.pronunciationIpa,
          audioUrl: link.word.audioUrl,
          exampleFr: link.word.exampleFr,
          exampleEn: link.word.exampleEn,
          imageUrl: link.word.imageUrl,
          synonyms: link.word.synonyms,
          commonMistake: link.word.commonMistake,
          level: link.word.level,
          unitTitle: link.word.unitTitle,
        };
      }),
      grammarPoints: lesson.grammarPoints.map((gp) => ({
        id: gp.id,
        title: gp.title,
        explanation: gp.explanation,
        examples: gp.examples.map((ex) => ({
          frenchText: ex.frenchText,
          englishText: ex.englishText,
        })),
      })),
      dialogues: lesson.dialogues.map((d) => ({
        id: d.id,
        title: d.title,
        context: d.context,
        lines: d.lines.map((line) => ({
          speaker: line.speaker,
          frenchText: line.frenchText,
          englishText: line.englishText,
          audioUrl: line.audioUrl,
        })),
      })),
      readingPassages: lesson.readingPassages.map((rp) => ({
        id: rp.id,
        title: rp.title,
        bodyFr: rp.bodyFr,
        bodyEn: rp.bodyEn,
        audioUrl: rp.audioUrl,
      })),
      listeningClips: lesson.listeningClips.map((lc) => ({
        id: lc.id,
        title: lc.title,
        audioUrl: lc.audioUrl,
        transcriptFr: lc.transcriptFr,
        transcriptEn: lc.transcriptEn,
      })),
      exercises: lesson.exercises.map((ex) => ({
        id: ex.id,
        type: ex.type,
        prompt: ex.prompt,
        options: ex.options,
        audioUrl: ex.audioUrl,
        imageUrl: ex.imageUrl,
        points: ex.points,
        // correctAnswer intentionally omitted — grading happens server-side
        // via submitExerciseAttempt, never trust the client with the key.
      })),
    };
  },

  /**
   * Grades a submitted answer, records the attempt, and applies side
   * effects: a MistakeLog row either way (feeds the dashboard's weak-topics
   * aggregation, keyed by the lesson title as the "topic"), XP on a correct
   * answer, and recomputes the lesson's overall progress as the fraction of
   * its exercises this user has ever answered correctly at least once.
   */
  async submitExerciseAttempt(userId: string, exerciseId: string, rawAnswer: string) {
    const exercise = await lessonRepository.findExerciseById(exerciseId);
    if (!exercise) {
      throw ApiError.notFound("Exercise not found");
    }

    const isCorrect = normalizeAnswer(rawAnswer) === normalizeAnswer(exercise.correctAnswer);

    await lessonRepository.createExerciseAttempt({
      userId,
      exerciseId,
      submittedAnswer: rawAnswer,
      isCorrect,
    });

    await lessonRepository.createMistakeLog({
      userId,
      topicTitle: exercise.lesson.title,
      skillKey: exercise.skillKey as SkillKey,
      correct: isCorrect,
    });

    if (isCorrect) {
      await lessonRepository.createXpTransaction({
        userId,
        amount: XP_PER_CORRECT_ANSWER,
        reason: "exercise_correct",
      });
    }

    const progress = await this.recomputeLessonProgress(userId, exercise.lessonId);

    return { isCorrect, correctAnswer: exercise.correctAnswer, lessonProgress: progress };
  },

  /** Progress = % of this lesson's exercises the user has answered correctly at least once. */
  async recomputeLessonProgress(userId: string, lessonId: string): Promise<number> {
    const [totalExercises, correctExerciseIds] = await Promise.all([
      prisma.exercise.count({ where: { lessonId } }),
      prisma.exerciseAttempt.findMany({
        where: { userId, isCorrect: true, exercise: { lessonId } },
        select: { exerciseId: true },
        distinct: ["exerciseId"],
      }),
    ]);

    const progress =
      totalExercises === 0 ? 0 : Math.round((correctExerciseIds.length / totalExercises) * 100);

    await lessonRepository.upsertLessonProgress(userId, lessonId, progress);
    return progress;
  },
};
