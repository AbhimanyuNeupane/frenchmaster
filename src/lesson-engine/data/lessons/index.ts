import type { Course, LessonSummary } from "../../types";

/**
 * Static manifest of bundled lessons. This is the local-JSON "index" the
 * LocalJsonContentProvider reads. Each entry lazily imports its JSON so lessons
 * aren't all eagerly bundled. The `load` thunks map 1:1 to the future S3 key
 * layout (`lessons/<lang>/<level>/<id>.json`), so swapping to a remote provider
 * is a data-location change, not a shape change.
 */
export interface LessonManifestEntry {
  summary: LessonSummary;
  load: () => Promise<{ default: unknown }>;
}

export const LESSON_MANIFEST: Record<string, LessonManifestEntry> = {
  fr_a1_lesson_001: {
    summary: {
      id: "fr_a1_lesson_001",
      language: "fr",
      level: "A1",
      title: "Greetings & Politeness",
      description: "Say hello, goodbye, and be polite in everyday French.",
      cardCount: 18,
    },
    load: () => import("./fr/A1/lesson_001.json"),
  },
  es_a1_lesson_001: {
    summary: {
      id: "es_a1_lesson_001",
      language: "es",
      level: "A1",
      title: "Saludos y Cortesía",
      description: "Greet, thank, and be polite in everyday Spanish.",
      cardCount: 14,
    },
    load: () => import("./es/A1/lesson_001.json"),
  },
};

export const COURSE_MANIFEST: Record<string, Course> = {
  fr_a1: {
    id: "fr_a1",
    language: "fr",
    level: "A1",
    title: "French · A1 Foundations",
    description: "Your first steps into French.",
    sections: [
      {
        id: "fr_a1_unit1",
        title: "Unit 1 — First Contact",
        lessons: [LESSON_MANIFEST.fr_a1_lesson_001.summary],
      },
    ],
  },
  es_a1: {
    id: "es_a1",
    language: "es",
    level: "A1",
    title: "Spanish · A1 Foundations",
    description: "Your first steps into Spanish.",
    sections: [
      {
        id: "es_a1_unit1",
        title: "Unidad 1 — Primer Contacto",
        lessons: [LESSON_MANIFEST.es_a1_lesson_001.summary],
      },
    ],
  },
};
