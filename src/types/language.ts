/**
 * Language + translation types shared across auth (signup), settings, the
 * learner vocabulary/lesson display, and the admin console. The public
 * `GET /api/languages` endpoint returns `Language` (enabled languages only);
 * the admin `GET /api/admin/languages` endpoint returns `AdminLanguage`
 * (every language, including disabled ones, plus timestamps).
 */

export interface Language {
  code: string;
  name: string;
  flagEmoji: string;
  displayOrder: number;
  isDefault: boolean;
}

/** Admin-facing language row — includes the enabled flag and audit timestamps. */
export interface AdminLanguage extends Language {
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A single (languageCode, text) translation pair. Used for the learner's
 * `nativeTranslation`, the admin vocabulary translations editor, and CSV
 * import rows — the shape is identical everywhere.
 */
export interface Translation {
  languageCode: string;
  text: string;
}
