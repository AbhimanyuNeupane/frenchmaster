/**
 * A media reference is intentionally opaque: it carries ONLY a `key`, never a
 * path or URL. Callers resolve it through the MediaService (see providers.ts),
 * which is the single seam where "where the bytes live" is decided. Today that
 * is `public/lesson-assets/<key>`; tomorrow it is a signed CDN URL — and no
 * card component or type needs to change.
 */
export interface MediaRef {
  key: string;
}
