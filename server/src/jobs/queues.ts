import { Queue } from "bullmq";
import { redis } from "@/config/redis";

/**
 * Skeleton job queue wiring only — no real processors yet. CLAUDE.md calls
 * for background jobs for emails, notifications, AI processing, file
 * processing, and report generation. This establishes the connection and
 * one representative queue so controllers can start enqueueing instead of
 * doing work synchronously, without building out full job processing now
 * (out of scope per current task).
 */
export const emailQueue = new Queue("email", { connection: redis });

/**
 * Example of the intended pattern for future controllers:
 *
 *   await emailQueue.add("welcome-email", { userId: user.id });
 *
 * A corresponding Worker (see src/workers/) would live in a separate
 * process in production and is intentionally not implemented yet.
 */
