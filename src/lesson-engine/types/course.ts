import type { LessonSummary } from "./lesson";

/** A Section groups lessons within a Course (e.g. "Unit 1 — Greetings"). */
export interface Section {
  id: string;
  title: string;
  description?: string;
  lessons: LessonSummary[];
}

/** Course -> Section -> Lesson -> Card is the content hierarchy. */
export interface Course {
  id: string;
  language: string;
  level: string;
  title: string;
  description?: string;
  sections: Section[];
}
