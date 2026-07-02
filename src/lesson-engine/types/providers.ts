import type { Course } from "./course";
import type { Lesson, LessonSummary } from "./lesson";
import type { MediaRef } from "./media";

/**
 * Content source abstraction. Today: local JSON. Tomorrow: an API/S3 provider
 * implementing the same interface. Selected once in services/content/index.ts,
 * so swapping the backend is a one-file change.
 */
export interface LessonContentProvider {
  getLesson(id: string): Promise<Lesson>;
  listLessons(filter: {
    language?: string;
    level?: string;
  }): Promise<LessonSummary[]>;
  getCourse(id: string): Promise<Course>;
}

/**
 * Media resolution abstraction. Cards pass an opaque MediaRef; the service
 * decides the actual URL. Today: local `public/lesson-assets/`. Tomorrow: a
 * signed CDN URL — same interface, one-file swap.
 */
export interface MediaService {
  resolveAudioUrl(ref: MediaRef): string;
  resolveImageUrl(ref: MediaRef): string;
}

/**
 * Persistence abstraction. Today: localStorage. Tomorrow: a debounced backend
 * sync. The store knows nothing about which one is active.
 */
export interface PersistenceProvider {
  save(key: string, state: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  clear(key: string): Promise<void>;
}
