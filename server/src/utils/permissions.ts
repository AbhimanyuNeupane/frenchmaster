import type { Prisma } from "@prisma/client";

/** Shape returned by userRepository.findById/findByEmail/create — a User with its Role's granted permissions. */
type UserWithPermissions = Prisma.UserGetPayload<{
  include: { role: { include: { permissions: { include: { permission: true } } } } };
}>;

/** Flattens a user's granted permission keys, for attaching to req.user or checking directly. */
export function permissionKeysOf(user: UserWithPermissions): string[] {
  return user.role.permissions.map((rp) => rp.permission.key);
}

/**
 * True if `userPermissions` grants `required`. A null/undefined `required`
 * means the content is fully public (no gating) — replaces the old ordinal
 * `hasRequiredRole`/ROLE_RANK check, which doesn't generalize once roles
 * aren't a strict linear hierarchy (e.g. Translator vs. Support). Backs
 * `LessonEngineLesson.requiredPermissionKey` content gating (see
 * lessonEngine.service.ts) — the Vocabulary catalog and the original
 * `/learn` Unit/Lesson system are NOT gated by this, per explicit product
 * scoping (a course/lesson-engine-only feature).
 */
export function hasPermission(userPermissions: string[] | undefined, required: string | null | undefined): boolean {
  if (!required) return true;
  if (!userPermissions) return false;
  return userPermissions.includes(required);
}
