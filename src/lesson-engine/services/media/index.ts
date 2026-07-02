import type { MediaService } from "../../types";
import { LocalMediaService } from "./localMediaService";

export type MediaBackend = "local" | "cdn";

/** Currently hardcoded to the local backend. This is the single place a future
 *  CDN/S3 media backend gets wired in. */
const ACTIVE_BACKEND: MediaBackend = "local";

let instance: MediaService | null = null;

/**
 * Factory + singleton. Everything in the app resolves media through this — no
 * component imports `LocalMediaService` by name. Changing the media backend
 * later is a one-line change here.
 */
export function getMediaService(): MediaService {
  if (instance) return instance;
  switch (ACTIVE_BACKEND) {
    case "local":
    default:
      instance = new LocalMediaService();
  }
  return instance;
}

export { LocalMediaService };
