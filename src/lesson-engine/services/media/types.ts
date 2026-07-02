export type { MediaService } from "../../types";
export type { MediaRef } from "../../types";

/** Public path (under /public) where local lesson assets live today. */
export const LOCAL_ASSET_BASE = "/lesson-assets";

/** Placeholder keys returned when a MediaRef is empty/missing, so callers never
 *  receive an invalid URL. Actual missing files are handled by <img>/<audio>
 *  onError fallbacks at the component level. */
export const PLACEHOLDER_IMAGE_KEY = "_placeholders/image.svg";
export const PLACEHOLDER_AUDIO_KEY = "_placeholders/audio.mp3";
