import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Single source of truth for environment configuration. Validated eagerly
 * at process boot so misconfiguration fails fast with a clear message
 * instead of surfacing as a confusing runtime error later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().optional(),

  // OAuth — optional today. Routes 501 until these are populated.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  // Storage — used by src/services/speech.service.ts to hold pronunciation
  // recordings (Supabase Storage bucket "pronunciation-audio"). Requires
  // the service role key (bypasses RLS/bucket policy) since uploads happen
  // server-side on the user's behalf.
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE: z.string().optional(),

  // AI providers.
  ELEVENLABS_API_KEY: z.string().optional(),
  GOOGLE_TTS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Speech-to-text for pronunciation scoring (src/services/speech.service.ts).
  // Falls back to OPENAI_API_KEY if unset, since OpenAI's Whisper endpoint
  // is the default provider — set this separately only if using a different
  // Whisper-compatible host (e.g. Groq).
  WHISPER_API_KEY: z.string().optional(),
  WHISPER_API_URL: z.string().default("https://api.openai.com/v1/audio/transcriptions"),

  // Payments — not used yet (out of scope).
  STRIPE_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email — not used yet (out of scope beyond plumbing).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

// Treat blank strings in .env (common for "fill in later" optional keys,
// e.g. `SMTP_PORT=`) as unset rather than as an empty string, so optional
// schema fields don't fail coercion/validation on placeholder values.
const sanitizedEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value])
);

const parsed = envSchema.safeParse(sanitizedEnv);

if (!parsed.success) {
  // Intentionally use console here — logger depends on env in some setups,
  // and we want this failure to be maximally visible before anything else
  // initializes.
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:");
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
