import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

/** Scalar fields an admin can author, minus id/timestamps/cardCount (cardCount is always server-derived). */
export interface LessonEngineLessonCreateData {
  id: string;
  language: string;
  level: string;
  title: string;
  description?: string | null;
  cardsJson: Prisma.InputJsonValue;
  cardCount: number;
  published: boolean;
}

export type LessonEngineLessonUpdateData = Partial<Omit<LessonEngineLessonCreateData, "id">>;

/**
 * Raw queries backing the lesson-engine admin CRUD + public read surface.
 * Same convention as admin.repository.ts: query shape/indexing lives here,
 * business logic (404s, conflict checks, id→cards renaming) lives in
 * lessonEngine.service.ts.
 */
export const lessonEngineRepository = {
  /**
   * Admin list projection — excludes cardsJson. The admin list view only
   * needs cardCount to render, not the full (potentially large) card array;
   * detail/edit fetches the full row via findLessonById.
   */
  findLessons(where: Prisma.LessonEngineLessonWhereInput, skip: number, take: number) {
    return prisma.lessonEngineLesson.findMany({
      where,
      select: {
        id: true,
        language: true,
        level: true,
        title: true,
        description: true,
        cardCount: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    });
  },

  countLessons(where: Prisma.LessonEngineLessonWhereInput) {
    return prisma.lessonEngineLesson.count({ where });
  },

  /** Full row including cardsJson, any deletedAt state — caller (service) decides how to treat soft-deleted rows. */
  findLessonById(id: string) {
    return prisma.lessonEngineLesson.findUnique({ where: { id } });
  },

  createLesson(data: LessonEngineLessonCreateData) {
    return prisma.lessonEngineLesson.create({ data });
  },

  updateLesson(id: string, data: LessonEngineLessonUpdateData) {
    return prisma.lessonEngineLesson.update({ where: { id }, data });
  },

  /** Soft delete — matches the VocabularyWord convention in admin.repository.ts's softDeleteVocabularyWord. */
  softDeleteLesson(id: string) {
    return prisma.lessonEngineLesson.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // --- Public (unauthenticated) read surface ---

  /** Summary projection for the public list — excludes cardsJson (only the detail endpoint returns full cards). */
  findPublishedLessons(where: Prisma.LessonEngineLessonWhereInput) {
    return prisma.lessonEngineLesson.findMany({
      where,
      select: {
        id: true,
        language: true,
        level: true,
        title: true,
        description: true,
        cardCount: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  findPublishedLessonById(id: string) {
    return prisma.lessonEngineLesson.findFirst({
      where: { id, published: true, deletedAt: null },
    });
  },
};
