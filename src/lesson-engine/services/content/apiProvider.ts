import type {
  Course,
  Lesson,
  LessonContentProvider,
  LessonSummary,
} from "../../types";
import { httpGet } from "./httpClient";
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

/**
 * Reads lessons from the real Express backend (`/api/lesson-engine/...`),
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
    const params = new URLSearchParams();
    if (filter.language) params.set("language", filter.language);
    if (filter.level) params.set("level", filter.level);
    const query = params.toString();

    const summaries = await httpGet<PublicLessonSummary[]>(
      `/api/lesson-engine/lessons${query ? `?${query}` : ""}`
    );

    return summaries.map((s) => ({
      id: s.id,
      language: s.language,
      level: s.level,
      title: s.title,
      description: s.description ?? undefined,
      cardCount: s.cardCount,
    }));
  }

  async getCourse(id: string): Promise<Course> {
    // There is no Course backend in this pass — it's explicitly out of scope on
    // the server too (no course table, no course endpoints). Throwing keeps the
    // interface honest rather than fabricating unused course data that would
    // silently diverge from whatever a real course model eventually looks like.
    throw new LessonLoadError(id, "Courses are not backed by real data yet");
  }
}
