import type { MediaRef, MediaService } from "../../types";
import {
  LOCAL_ASSET_BASE,
  PLACEHOLDER_AUDIO_KEY,
  PLACEHOLDER_IMAGE_KEY,
} from "./types";

function resolve(key: string): string {
  const clean = key.replace(/^\/+/, "");
  return `${LOCAL_ASSET_BASE}/${clean}`;
}

/**
 * Resolves opaque MediaRef keys against the local `public/lesson-assets/`
 * folder. A missing/empty ref resolves to a placeholder key rather than
 * throwing (Error Handling requirement). Swap this out for a CDN implementation
 * in services/media/index.ts and nothing else changes.
 */
export class LocalMediaService implements MediaService {
  resolveImageUrl(ref: MediaRef | undefined): string {
    if (!ref?.key) return resolve(PLACEHOLDER_IMAGE_KEY);
    return resolve(ref.key);
  }

  resolveAudioUrl(ref: MediaRef | undefined): string {
    if (!ref?.key) return resolve(PLACEHOLDER_AUDIO_KEY);
    return resolve(ref.key);
  }
}
