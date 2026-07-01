import type { Role } from "@prisma/client";

/** Payload embedded in short-lived access tokens. */
export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
