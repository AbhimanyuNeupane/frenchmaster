import { PrismaClient } from "@prisma/client";
import { isProduction } from "./env";

/**
 * Prisma client singleton. Guards against creating multiple clients during
 * ts-node-dev/tsx hot-reload in development (each would open its own
 * connection pool and eventually exhaust Postgres connections).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn"],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
