import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

/**
 * Redis connection singleton, shared by caching and BullMQ. BullMQ requires
 * `maxRetriesPerRequest: null` on the connection it uses.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error({ err }, "Redis connection error"));
