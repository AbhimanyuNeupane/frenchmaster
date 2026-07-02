import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

export const PRONUNCIATION_AUDIO_BUCKET = "pronunciation-audio";

/**
 * Lazily-constructed — env.SUPABASE_URL/SERVICE_ROLE aren't set in every
 * environment yet (see speech.service.ts, which checks isStorageConfigured()
 * before ever calling this). Constructing eagerly at module load would
 * throw on import in any environment without those vars, which would break
 * `npm run build`/typecheck and any route that merely imports this module
 * transitively — not just the speech routes.
 */
let client: SupabaseClient | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE);
}

export function getSupabaseStorageClient(): SupabaseClient {
  if (!isStorageConfigured()) {
    throw new Error("Supabase Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE missing)");
  }
  if (!client) {
    // Service role key — bypasses RLS/bucket policy. Server-side only, never
    // shipped to the frontend (see docs/DEPLOYMENT.md storage section).
    client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE!);
  }
  return client;
}
