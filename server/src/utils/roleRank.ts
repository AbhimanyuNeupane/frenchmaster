import type { Role } from "@prisma/client";

/**
 * Numeric rank per Role, higher = more privileged. Backs
 * `LessonEngineLesson.requiredRole` content gating only (see
 * lessonEngine.service.ts) — the Vocabulary catalog and the original
 * `/learn` Unit/Lesson system are NOT gated by this, per explicit product
 * scoping (a course/lesson-engine-only feature).
 */
const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  PREMIUM: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

/**
 * True if `userRole` satisfies `required`. A null/undefined `required`
 * means the content is fully public (no gating). An anonymous requester
 * (`userRole` undefined, i.e. no/invalid session — see `optionalAuth`) can
 * only ever satisfy a null/undefined requirement.
 */
export function hasRequiredRole(userRole: Role | undefined, required: Role | null | undefined): boolean {
  if (!required) return true;
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}
