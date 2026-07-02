# services/media/

The media resolution abstraction.

- `types.ts` — re-exports the `MediaService` interface + local asset constants.
- `localMediaService.ts` — resolves an opaque `MediaRef.key` against
  `public/lesson-assets/`. Missing/empty refs resolve to a placeholder key
  rather than throwing; genuinely missing files are handled by `<img>/<audio>`
  `onError` fallbacks in `cards/_media.tsx`.
- `index.ts` — the factory/singleton `getMediaService()`.

**Design point:** cards never build a path or URL themselves — they call
`useMediaService()` and pass the JSON's `MediaRef` through it. `MediaRef` is
opaque everywhere (`{ key }`), so callers can't accidentally depend on where the
bytes live.

**Extension point — go CDN:** implement `MediaService` (e.g. `CdnMediaService`
resolving the same `key` to a signed CloudFront/S3 URL) and select it in
**`services/media/index.ts`**. No card changes.
