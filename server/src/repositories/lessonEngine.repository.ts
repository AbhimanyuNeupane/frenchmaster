import { prisma } from "../config/prisma";
import type { Prisma, Role } from "@prisma/client";

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
  requiredRole: Role | null;
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
        requiredRole: true,
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
        requiredRole: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  findPublishedLessonById(id: string) {
    return prisma.lessonEngineLesson.findFirst({
      where: { id, published: true, deletedAt: null },
    });
  },

  // ---------------------------------------------------------------------
  // Course / Section hierarchy
  // ---------------------------------------------------------------------

  /** Admin detail include: full section -> lessonLink -> lesson tree, ordered. */
  courseDetailInclude: {
    sections: {
      orderBy: { displayOrder: "asc" },
      include: {
        lessonLinks: {
          orderBy: { displayOrder: "asc" },
          include: { lesson: true },
        },
      },
    },
  } satisfies Prisma.LessonEngineCourseInclude,

  /**
   * Public detail include: same shape, but each section's `lessonLinks` is
   * filtered so only links pointing at a currently published, non-deleted
   * lesson are returned — a course/section being published never overrides
   * an individual lesson's own `published: false`. `LessonEngineSection`
   * itself has no published/deletedAt of its own (see schema.prisma), so
   * there is nothing to filter at the section level beyond the course-level
   * `published`/`deletedAt` gate applied in the `where` of the query below.
   */
  publishedCourseDetailInclude: {
    sections: {
      orderBy: { displayOrder: "asc" },
      include: {
        lessonLinks: {
          where: { lesson: { published: true, deletedAt: null } },
          orderBy: { displayOrder: "asc" },
          include: { lesson: true },
        },
      },
    },
  } satisfies Prisma.LessonEngineCourseInclude,

  findCourses(where: Prisma.LessonEngineCourseWhereInput, skip: number, take: number) {
    return prisma.lessonEngineCourse.findMany({
      where,
      select: {
        id: true,
        language: true,
        level: true,
        title: true,
        description: true,
        published: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sections: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      skip,
      take,
    });
  },

  countCourses(where: Prisma.LessonEngineCourseWhereInput) {
    return prisma.lessonEngineCourse.count({ where });
  },

  findCourseById(id: string) {
    return prisma.lessonEngineCourse.findUnique({
      where: { id },
      include: this.courseDetailInclude,
    });
  },

  /**
   * Creates a course and its sections/lesson-links in one transaction.
   * Section ids are always server-generated (uuid, per schema) — any `id`
   * present on an incoming section payload entry is ignored on create.
   */
  async createCourse(data: LessonEngineCourseCreateData) {
    const { sections, ...courseData } = data;
    return prisma.$transaction(async (tx) => {
      const course = await tx.lessonEngineCourse.create({ data: courseData });
      await createSectionsInTx(tx, course.id, sections);
      return tx.lessonEngineCourse.findUniqueOrThrow({
        where: { id: course.id },
        include: this.courseDetailInclude,
      });
    });
  },

  /**
   * Updates course scalars and, if `sections` is present in `data` at all
   * (even an empty array), REPLACES the entire section/lesson-link
   * structure: deletes every existing `LessonEngineSection` for this course
   * (cascades to their `LessonEngineSectionLesson` rows per the schema's
   * `onDelete: Cascade`) and recreates from the payload, each section's
   * ordered `lessonIds` becoming ordered `LessonEngineSectionLesson` rows.
   * `sections === undefined` means "leave sections untouched" — the caller
   * (lessonEngine.service.ts) only passes this key when the admin's PATCH
   * body actually included it.
   */
  async updateCourse(id: string, data: LessonEngineCourseUpdateData) {
    const { sections, ...courseData } = data;
    return prisma.$transaction(async (tx) => {
      if (Object.keys(courseData).length > 0) {
        await tx.lessonEngineCourse.update({ where: { id }, data: courseData });
      }
      if (sections !== undefined) {
        await tx.lessonEngineSection.deleteMany({ where: { courseId: id } });
        await createSectionsInTx(tx, id, sections);
      }
      return tx.lessonEngineCourse.findUniqueOrThrow({
        where: { id },
        include: this.courseDetailInclude,
      });
    });
  },

  /** Soft delete — matches softDeleteLesson's convention. Sections/links are left in place (history), just orphaned from the public surface via the course's own deletedAt filter. */
  softDeleteCourse(id: string) {
    return prisma.lessonEngineCourse.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // --- Public (unauthenticated) read surface ---

  findPublishedCourses(where: Prisma.LessonEngineCourseWhereInput) {
    return prisma.lessonEngineCourse.findMany({
      where,
      select: {
        id: true,
        language: true,
        level: true,
        title: true,
        description: true,
        displayOrder: true,
      },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    });
  },

  findPublishedCourseById(id: string) {
    return prisma.lessonEngineCourse.findFirst({
      where: { id, published: true, deletedAt: null },
      include: this.publishedCourseDetailInclude,
    });
  },
};

/** Scalar fields an admin can author for a course, minus id/timestamps. */
export interface LessonEngineCourseSectionInput {
  /** Present when editing an existing section; ignored by persistence (see createCourse/updateCourse) — sections are always regenerated wholesale, never diffed by id. */
  id?: string;
  title: string;
  displayOrder: number;
  /** Ordered — index in the array becomes the LessonEngineSectionLesson.displayOrder within the section. */
  lessonIds: string[];
}

export interface LessonEngineCourseCreateData {
  id: string;
  language: string;
  level: string;
  title: string;
  description?: string | null;
  published: boolean;
  displayOrder: number;
  sections: LessonEngineCourseSectionInput[];
}

export type LessonEngineCourseUpdateData = Partial<Omit<LessonEngineCourseCreateData, "id">>;

/** Shared by createCourse/updateCourse: creates each section then its ordered lesson links, inside the caller's transaction. */
async function createSectionsInTx(
  tx: Prisma.TransactionClient,
  courseId: string,
  sections: LessonEngineCourseSectionInput[]
): Promise<void> {
  for (const section of sections) {
    const createdSection = await tx.lessonEngineSection.create({
      data: { courseId, title: section.title, displayOrder: section.displayOrder },
    });
    if (section.lessonIds.length > 0) {
      await tx.lessonEngineSectionLesson.createMany({
        data: section.lessonIds.map((lessonId, index) => ({
          sectionId: createdSection.id,
          lessonId,
          displayOrder: index,
        })),
      });
    }
  }
}
