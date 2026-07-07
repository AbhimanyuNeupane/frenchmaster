import { lessonEngineRepository } from "../repositories/lessonEngine.repository";
import { ApiError } from "../utils/ApiError";
import { hasPermission } from "../utils/permissions";
import { Prisma as PrismaRuntime, type LessonEngineLesson, type Prisma } from "@prisma/client";
import {
  validateLessonDraftSchema,
  type CreateLessonEngineCourseInput,
  type CreateLessonEngineLessonInput,
  type ListLessonEngineCoursesQuery,
  type ListLessonEngineLessonsQuery,
  type ListPublishedCoursesQuery,
  type ListPublishedLessonsQuery,
  type UpdateLessonEngineCourseInput,
  type UpdateLessonEngineLessonInput,
} from "../validators/lessonEngine.validators";

/** Card envelope shape as it travels across the API surface (see validators for the structural-only schema this is derived from). */
type LessonCard = CreateLessonEngineLessonInput["cards"][number];

/** Renames the `cardsJson` Prisma column to `cards` on the admin-facing API surface — the column name is an implementation detail. */
function toAdminLesson(lesson: LessonEngineLesson) {
  const { cardsJson, ...rest } = lesson;
  return { ...rest, cards: cardsJson as unknown as LessonCard[] };
}

/**
 * Public summary shape (list endpoints + embedded in a course's sections).
 * `locked` reflects Feature C content gating: the lesson is always present
 * in the list (so a course's premium content is discoverable, not hidden —
 * bad product sense to make it invisible) but `locked: true` means the
 * requester can't play it yet. This is independent of `published`/
 * `deletedAt`, which are hard DB-level filters applied before this point —
 * an unpublished/deleted lesson never reaches this function at all.
 */
function toPublicLessonSummary(
  lesson: {
    id: string;
    language: string;
    level: string;
    title: string;
    description: string | null;
    cardCount: number;
    requiredPermissionKey: string | null;
  },
  requesterPermissions: string[] | undefined
) {
  return {
    id: lesson.id,
    language: lesson.language,
    level: lesson.level,
    title: lesson.title,
    description: lesson.description,
    cardCount: lesson.cardCount,
    locked: !hasPermission(requesterPermissions, lesson.requiredPermissionKey),
  };
}

/** Public single-lesson shape matches the frontend's `Lesson` type — `cards`, not `cardsJson`. */
function toPublicDetail(lesson: LessonEngineLesson) {
  return {
    id: lesson.id,
    language: lesson.language,
    level: lesson.level,
    title: lesson.title,
    description: lesson.description,
    cards: lesson.cardsJson as unknown as LessonCard[],
  };
}

/** Admin course summary (list endpoint) — no nested sections, adds a cheap sectionCount from the repository's `_count`. */
function toAdminCourseSummary(course: {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  published: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { sections: number };
}) {
  const { _count, ...rest } = course;
  return { ...rest, sectionCount: _count.sections };
}

type AdminCourseDetailRow = NonNullable<
  Awaited<ReturnType<typeof lessonEngineRepository.findCourseById>>
>;

/**
 * Admin course detail — full section -> lesson tree, each lesson embedded
 * with enough fields for the admin UI to render/edit (title, cardCount,
 * published, requiredPermissionKey) without a second round-trip. Contrast with the
 * write path (create/update), which takes `lessonIds` (ids only, ordered) —
 * this is the read shape, not the write shape.
 */
function toAdminCourseDetail(course: AdminCourseDetailRow) {
  return {
    id: course.id,
    language: course.language,
    level: course.level,
    title: course.title,
    description: course.description,
    published: course.published,
    displayOrder: course.displayOrder,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    sections: course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      displayOrder: section.displayOrder,
      lessons: section.lessonLinks.map((link) => ({
        id: link.lesson.id,
        title: link.lesson.title,
        language: link.lesson.language,
        level: link.lesson.level,
        cardCount: link.lesson.cardCount,
        published: link.lesson.published,
        requiredPermissionKey: link.lesson.requiredPermissionKey,
        displayOrder: link.displayOrder,
      })),
    })),
  };
}

/** Public course summary (list endpoint) — no nested sections. */
function toPublicCourseSummary(course: {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  displayOrder: number;
}) {
  return {
    id: course.id,
    language: course.language,
    level: course.level,
    title: course.title,
    description: course.description,
    displayOrder: course.displayOrder,
  };
}

type PublicCourseDetailRow = NonNullable<
  Awaited<ReturnType<typeof lessonEngineRepository.findPublishedCourseById>>
>;

/**
 * Public course detail — each lesson entry is the same summary shape used
 * by listPublishedLessons (id/language/level/title/description/cardCount)
 * plus `locked` computed against the requester's role. Empty sections
 * (every lesson in the section filtered out at the query level for being
 * unpublished/deleted) are still returned rather than hidden — see the
 * repository's `publishedCourseDetailInclude` doc comment; JUDGMENT CALL:
 * showing an empty section keeps the course's structure/table-of-contents
 * stable and predictable for the frontend rather than having sections
 * silently appear/disappear as their last visible lesson is unpublished.
 */
function toPublicCourseDetail(course: PublicCourseDetailRow, requesterPermissions: string[] | undefined) {
  return {
    id: course.id,
    language: course.language,
    level: course.level,
    title: course.title,
    description: course.description,
    displayOrder: course.displayOrder,
    sections: course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      displayOrder: section.displayOrder,
      lessons: section.lessonLinks.map((link) => toPublicLessonSummary(link.lesson, requesterPermissions)),
    })),
  };
}

export const lessonEngineService = {
  // --- Admin: Lessons ---

  async listLessons(query: ListLessonEngineLessonsQuery) {
    const where: Prisma.LessonEngineLessonWhereInput = {
      deletedAt: null,
      ...(query.language ? { language: query.language } : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.published !== undefined ? { published: query.published } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [lessons, total] = await Promise.all([
      lessonEngineRepository.findLessons(where, skip, query.pageSize),
      lessonEngineRepository.countLessons(where),
    ]);

    return {
      lessons,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async getLessonForAdmin(id: string) {
    const lesson = await lessonEngineRepository.findLessonById(id);
    if (!lesson || lesson.deletedAt) {
      throw ApiError.notFound("Lesson not found");
    }
    return toAdminLesson(lesson);
  },

  /**
   * cardCount is always computed server-side from cards.length — the
   * validators never accept a client-supplied count. Checks for an existing
   * id up front (cheap, gives a fast/clear error in the common case), but
   * also catches the Prisma unique-constraint violation on the create
   * itself — closes the TOCTOU race between two concurrent creates of the
   * same id, which would otherwise surface as a generic 500.
   */
  async createLesson(input: CreateLessonEngineLessonInput) {
    const existing = await lessonEngineRepository.findLessonById(input.id);
    if (existing) {
      throw ApiError.conflict(`Lesson id "${input.id}" already exists`);
    }

    try {
      const lesson = await lessonEngineRepository.createLesson({
        id: input.id,
        language: input.language,
        level: input.level,
        title: input.title,
        description: input.description ?? null,
        cardsJson: input.cards as unknown as Prisma.InputJsonValue,
        cardCount: input.cards.length,
        published: input.published,
        requiredPermissionKey: input.requiredPermissionKey ?? null,
      });
      return toAdminLesson(lesson);
    } catch (err) {
      if (err instanceof PrismaRuntime.PrismaClientKnownRequestError && err.code === "P2002") {
        throw ApiError.conflict(`Lesson id "${input.id}" already exists`);
      }
      throw err;
    }
  },

  async updateLesson(id: string, input: UpdateLessonEngineLessonInput) {
    const existing = await lessonEngineRepository.findLessonById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Lesson not found");
    }

    const lesson = await lessonEngineRepository.updateLesson(id, {
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.level !== undefined ? { level: input.level } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.cards !== undefined
        ? { cardsJson: input.cards as unknown as Prisma.InputJsonValue, cardCount: input.cards.length }
        : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(input.requiredPermissionKey !== undefined ? { requiredPermissionKey: input.requiredPermissionKey } : {}),
    });
    return toAdminLesson(lesson);
  },

  async deleteLesson(id: string) {
    const existing = await lessonEngineRepository.findLessonById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Lesson not found");
    }
    await lessonEngineRepository.softDeleteLesson(id);
  },

  /**
   * Dry-run structural validation backing the admin "Validate" button.
   * Reports results rather than throwing — this endpoint's whole purpose is
   * to surface errors to the UI before Save, not to enforce them. Runs the
   * same structural-only schema as create/update (see validators file for
   * why this isn't the frontend's full per-card-type union). Input is
   * `unknown` on purpose: this route has no `validate()` middleware in
   * front of it, since a hard 422 would defeat the point of a dry-run.
   */
  validateDraft(input: unknown): { valid: boolean; errors: string[] } {
    const result = validateLessonDraftSchema.safeParse(input);
    if (result.success) {
      return { valid: true, errors: [] };
    }
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`
    );
    return { valid: false, errors };
  },

  // --- Public: Lessons ---

  async listPublishedLessons(filter: ListPublishedLessonsQuery, requesterPermissions: string[] | undefined) {
    const where: Prisma.LessonEngineLessonWhereInput = {
      published: true,
      deletedAt: null,
      ...(filter.language ? { language: filter.language } : {}),
      ...(filter.level ? { level: filter.level } : {}),
    };
    const lessons = await lessonEngineRepository.findPublishedLessons(where);
    return lessons.map((lesson) => toPublicLessonSummary(lesson, requesterPermissions));
  },

  /**
   * Permission-gate enforcement (Feature C): a lesson with a non-null
   * `requiredPermissionKey` the requester doesn't hold 403s here — gating
   * blocks *playing* the lesson, never just hides it (see
   * listPublishedLessons's `locked` flag for the discovery side).
   * `requiredPermissionKey` is included in the error's `details` so the
   * frontend can render a specific "upgrade to X" message instead of a
   * generic error.
   */
  async getPublishedLesson(id: string, requesterPermissions: string[] | undefined) {
    const lesson = await lessonEngineRepository.findPublishedLessonById(id);
    if (!lesson) {
      throw ApiError.notFound("Lesson not found");
    }
    if (!hasPermission(requesterPermissions, lesson.requiredPermissionKey)) {
      throw ApiError.forbidden(`This lesson requires the "${lesson.requiredPermissionKey}" permission.`, {
        requiredPermissionKey: lesson.requiredPermissionKey,
      });
    }
    return toPublicDetail(lesson);
  },

  // --- Admin: Courses ---

  async listCoursesForAdmin(query: ListLessonEngineCoursesQuery) {
    const where: Prisma.LessonEngineCourseWhereInput = {
      deletedAt: null,
      ...(query.language ? { language: query.language } : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.published !== undefined ? { published: query.published } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [courses, total] = await Promise.all([
      lessonEngineRepository.findCourses(where, skip, query.pageSize),
      lessonEngineRepository.countCourses(where),
    ]);

    return {
      courses: courses.map(toAdminCourseSummary),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async getCourseForAdmin(id: string) {
    const course = await lessonEngineRepository.findCourseById(id);
    if (!course || course.deletedAt) {
      throw ApiError.notFound("Course not found");
    }
    return toAdminCourseDetail(course);
  },

  /**
   * Same TOCTOU-hardening pattern as createLesson: a fast pre-check for the
   * common case, plus a P2002 catch around the actual insert.
   */
  async createCourse(input: CreateLessonEngineCourseInput) {
    const existing = await lessonEngineRepository.findCourseById(input.id);
    if (existing) {
      throw ApiError.conflict(`Course id "${input.id}" already exists`);
    }

    try {
      const course = await lessonEngineRepository.createCourse({
        id: input.id,
        language: input.language,
        level: input.level,
        title: input.title,
        description: input.description ?? null,
        published: input.published,
        displayOrder: input.displayOrder,
        sections: input.sections,
      });
      return toAdminCourseDetail(course);
    } catch (err) {
      if (err instanceof PrismaRuntime.PrismaClientKnownRequestError && err.code === "P2002") {
        throw ApiError.conflict(`Course id "${input.id}" already exists`);
      }
      throw err;
    }
  },

  async updateCourse(id: string, input: UpdateLessonEngineCourseInput) {
    const existing = await lessonEngineRepository.findCourseById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Course not found");
    }

    const course = await lessonEngineRepository.updateCourse(id, {
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.level !== undefined ? { level: input.level } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.sections !== undefined ? { sections: input.sections } : {}),
    });
    return toAdminCourseDetail(course);
  },

  async deleteCourse(id: string) {
    const existing = await lessonEngineRepository.findCourseById(id);
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound("Course not found");
    }
    await lessonEngineRepository.softDeleteCourse(id);
  },

  // --- Public: Courses ---

  async listPublishedCourses(filter: ListPublishedCoursesQuery) {
    const where: Prisma.LessonEngineCourseWhereInput = {
      published: true,
      deletedAt: null,
      ...(filter.language ? { language: filter.language } : {}),
      ...(filter.level ? { level: filter.level } : {}),
    };
    const courses = await lessonEngineRepository.findPublishedCourses(where);
    return courses.map(toPublicCourseSummary);
  },

  /**
   * Integration point between Feature B (courses) and Feature C (gating):
   * needs the requester's live permissions to compute `locked` per embedded
   * lesson, so it's a required parameter rather than being resolved
   * internally.
   */
  async getPublishedCourse(id: string, requesterPermissions: string[] | undefined) {
    const course = await lessonEngineRepository.findPublishedCourseById(id);
    if (!course) {
      throw ApiError.notFound("Course not found");
    }
    return toPublicCourseDetail(course, requesterPermissions);
  },
};
