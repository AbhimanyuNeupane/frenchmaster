import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: passwordSchema,
  name: z.string().trim().min(1, "Name is required").max(100),
  // Must be an existing, ENABLED Language.code — verified against the DB in
  // auth.service.ts (Zod alone can't check that). Omitted -> defaults to "en".
  primaryLanguage: z.string().trim().toLowerCase().min(2).max(10).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

/** PATCH /api/auth/me — the only profile field this pass supports updating. */
export const updateProfileSchema = z.object({
  primaryLanguage: z.string().trim().toLowerCase().min(2).max(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
