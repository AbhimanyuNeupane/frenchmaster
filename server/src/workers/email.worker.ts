import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { logger } from "../config/logger";

/**
 * Skeleton worker — not started by the main server process. This is a
 * placeholder demonstrating the intended shape; real email sending (SMTP
 * wiring, templates) is out of scope for this task. Run separately in
 * production, e.g. `tsx src/workers/email.worker.ts`, as its own process.
 */
export const emailWorker = new Worker(
  "email",
  async (job) => {
    logger.info({ jobId: job.id, name: job.name }, "Processing email job (stub, no-op)");
    // TODO: implement real email sending once SMTP credentials exist.
  },
  { connection: redis, autorun: false }
);
