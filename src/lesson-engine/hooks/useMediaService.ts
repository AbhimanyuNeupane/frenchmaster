import { useMemo } from "react";
import type { MediaService } from "../types";
import { getMediaService } from "../services/media";

/**
 * Card-facing hook. Cards call `useMediaService()` and resolve their MediaRefs
 * through it — they never build a path/URL themselves. The indirection is what
 * lets a future CDN backend drop in without touching a single card.
 */
export function useMediaService(): MediaService {
  return useMemo(() => getMediaService(), []);
}
