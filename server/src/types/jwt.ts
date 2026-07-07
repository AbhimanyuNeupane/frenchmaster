/** Payload embedded in short-lived access tokens. */
export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: string; // role slug (Role.id), e.g. "administrator" — informational only; authorization uses live permissions (see RequestUser), not this field, so it's never stale
}

/**
 * What `req.user` actually holds after requireAuth/optionalAuth — the JWT
 * payload plus a `permissions` array fetched fresh from the DB on every
 * request (see middleware/auth.ts). Never trust a JWT-embedded permission
 * set: roles/permissions must take effect immediately when an admin edits
 * them, not after the access token expires.
 */
export interface RequestUser extends AccessTokenPayload {
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
