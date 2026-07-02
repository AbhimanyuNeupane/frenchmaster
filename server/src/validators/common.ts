import { z } from "zod";

/**
 * Every model's `id` column is a plain TEXT primary key — Prisma's
 * `@default(uuid())` generates UUID-shaped values for app-created rows, but
 * seed data intentionally uses human-readable slugs (e.g. "seed-lsn-a1-u1-l1")
 * as an established convention. A stricter `.uuid()` check here rejects
 * that legitimate seed data, so route params only enforce a sane
 * non-empty/bounded-length string — Prisma's parameterized queries make
 * this safe regardless of shape, and a non-existent id 404s downstream.
 */
export const idSchema = z.string().trim().min(1).max(100);
