import { lessonEngineRepository } from "../repositories/lessonEngine.repository";
import { ApiError } from "../utils/ApiError";
import { Prisma as PrismaRuntime, type LessonEngineLesson, type Prisma } from "@prisma/client";
import {
  validateLessonDraftSchema,
  type CreateLessonEngineLessonInput,
  type ListLessonEngineLessonsQuery,
  type ListPublishedLessonsQuery,
  type UpdateLessonEngineLessonInput,
} from "../validators/lessonEngine.validators";

/** Card envelope shape as it travels across the API surface (see validators for the structural-only schema this is derived from). */
type LessonCard = CreateLessonEngineLessonInput["cards"][number];

/** Renames the `cardsJson` Prisma column to `cards` on the admin-facing API surface — the column name is an implementation detail. */
function toAdminLesson(lesson: LessonEngineLesson) {
  const { cardsJson, ...rest } = lesson;
  return { ...rest, cards: cardsJson as unknown as LessonCard[] };
}

function toPublicSummary(lesson: {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  cardCount: number;
}) {
  return {
    id: lesson.id,
    language: lesson.language,
    level: lesson.level,
    title: lesson.title,
    description: lesson.description,
    cardCount: lesson.cardCount,
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

export const lessonEngineService = {
  // --- Admin ---

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

  // --- Public (unauthenticated) ---

  async listPublishedLessons(filter: ListPublishedLessonsQuery) {
    const where: Prisma.LessonEngineLessonWhereInput = {
      published: true,
      deletedAt: null,
      ...(filter.language ? { language: filter.language } : {}),
      ...(filter.level ? { level: filter.level } : {}),
    };
    const lessons = await lessonEngineRepository.findPublishedLessons(where);
    return lessons.map(toPublicSummary);
  },

  async getPublishedLesson(id: string) {
    const lesson = await lessonEngineRepository.findPublishedLessonById(id);
    if (!lesson) {
      throw ApiError.notFound("Lesson not found");
    }
    return toPublicDetail(lesson);
  },
};
