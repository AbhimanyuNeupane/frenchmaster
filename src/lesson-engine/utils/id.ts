let counter = 0;

/**
 * Generates a stable-enough unique id for ephemeral UI keys. Not cryptographic;
 * for content ids we rely on the ids authored in the lesson JSON.
 */
export function generateId(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
