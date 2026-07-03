import type {
  Course,
  CourseSummary,
  Lesson,
  LessonContentProvider,
  LessonSummary,
  Section,
} from "../../types";
import { httpGet, HttpError } from "./httpClient";
import { lessonSchema } from "./schema";
import { LessonLoadError } from "./types";

/** Shape of a public list item returned by `GET /api/lesson-engine/lessons`. */
interface PublicLessonSummary {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  cardCount: number;
  locked: boolean;
}

/** Shape of a public course list item returned by `GET /api/lesson-engine/courses`. */
interface PublicCourseSummary {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  displayOrder: number;
}

/** Shape of the full published course returned by `GET /api/lesson-engine/courses/:id`. */
interface PublicCourseDetail extends PublicCourseSummary {
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    lessons: PublicLessonSummary[];
  }>;
}

/**
 * The backend persists an absent description as SQL `NULL`, but the engine's
 * `lessonSchema` treats `description` as `string | undefined` (optional, not
 * nullable). Strip a `null` so a perfectly valid lesson isn't rejected by the
 * strict validation below. Left untouched otherwise.
 */
function normalizeLessonPayload(raw: unknown): unknown {
  if (
    raw &&
    typeof raw === "object" &&
    "description" in raw &&
    (raw as Record<string, unknown>).description === null
  ) {
    const copy = { ...(raw as Record<string, unknown>) };
    delete copy.description;
    return copy;
  }
  return raw;
}

/** Reads `details.requiredRole` off an HttpError's failure envelope, if present. */
function extractRequiredRole(err: unknown): string | undefined {
  if (err instanceof HttpError && err.details && typeof err.details === "object") {
    const role = (err.details as Record<string, unknown>).requiredRole;
    if (typeof role === "string") return role;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * Reads lessons/courses from the real Express backend (`/api/lesson-engine/...`),
 * implementing the exact same `LessonContentProvider` interface as
 * `LocalJsonContentProvider`. Selected in `services/content/index.ts`; nothing
 * else in the engine references it by name.
 *
 * Defense in depth: even though this is our own API, `getLesson` re-validates
 * every response against the engine's full 21-card-type `lessonSchema` before
 * handing it to the renderer. The backend only does light structural checks
 * (non-empty cards, unique ids), so this is the layer that guarantees a card
 * component never receives a malformed `content`/`validation` payload — the
 * same guarantee `LocalJsonContentProvider` gives for bundled JSON. Never trust
 * the network, even when the network is us.
 */
export class ApiContentProvider implements LessonContentProvider {
  async getLesson(id: string): Promise<Lesson> {
    let raw: unknown;
    try {
      raw = await httpGet<unknown>(
        `/api/lesson-engine/lessons/${encodeURIComponent(id)}`
      );
    } catch (err) {
      // A 403 means the lesson is gated (Feature C), not broken/missing. Surface
      // the requiredRole so the error boundary can show a specific message.
      const requiredRole = extractRequiredRole(err);
      if (requiredRole) {
        throw new LessonLoadError(
          id,
          `This lesson requires a ${requiredRole} account.`,
          err,
          requiredRole
        );
      }
      throw new LessonLoadError(id, `Failed to load lesson "${id}".`, err);
    }

    const parsed = lessonSchema.safeParse(normalizeLessonPayload(raw));
    if (!parsed.success) {
      throw new LessonLoadError(
        id,
        `Lesson "${id}" failed validation: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
        parsed.error
      );
    }
    // The parsed shape matches the LessonCard union by construction.
    return parsed.data as Lesson;
  }

  async listLessons(filter: {
    language?: string;
    level?: string;
  }): Promise<LessonSummary[]> {
    const summaries = await httpGet<PublicLessonSummary[]>(
      `/api/lesson-engine/lessons${buildQuery(filter)}`
    );

    return summaries.map(toLessonSummary);
  }

  async getCourse(id: string): Promise<Course> {
    let raw: unknown;
    try {
      raw = await httpGet<unknown>(
        `/api/lesson-engine/courses/${encodeURIComponent(id)}`
      );
    } catch (err) {
      throw new LessonLoadError(id, `Failed to load course "${id}".`, err);
    }

    // Course has no card-shaped content to get subtly wrong (that's why lessons
    // get a full Zod schema and courses don't), but we still guard against
    // garbage: id/language/level/title must be strings and sections an array.
    if (
      !isRecord(raw) ||
      typeof raw.id !== "string" ||
      typeof raw.language !== "string" ||
      typeof raw.level !== "string" ||
      typeof raw.title !== "string" ||
      !Array.isArray(raw.sections)
    ) {
      throw new LessonLoadError(id, `Course "${id}" returned an unexpected shape.`);
    }

    const course = raw as unknown as PublicCourseDetail;
    const sections: Section[] = course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      lessons: (section.lessons ?? []).map(toLessonSummary),
    }));

    return {
      id: course.id,
      language: course.language,
      level: course.level,
      title: course.title,
      description: course.description ?? undefined,
      sections,
    };
  }

  async listCourses(filter: {
    language?: string;
    level?: string;
  }): Promise<CourseSummary[]> {
    const summaries = await httpGet<PublicCourseSummary[]>(
      `/api/lesson-engine/courses${buildQuery(filter)}`
    );

    return summaries.map((c) => ({
      id: c.id,
      language: c.language,
      level: c.level,
      title: c.title,
      description: c.description ?? undefined,
    }));
  }
}

function buildQuery(filter: { language?: string; level?: string }): string {
  const params = new URLSearchParams();
  if (filter.language) params.set("language", filter.language);
  if (filter.level) params.set("level", filter.level);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function toLessonSummary(s: PublicLessonSummary): LessonSummary {
  return {
    id: s.id,
    language: s.language,
    level: s.level,
    title: s.title,
    description: s.description ?? undefined,
    cardCount: s.cardCount,
    locked: s.locked,
  };
}
