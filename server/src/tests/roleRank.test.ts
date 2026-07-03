import { describe, it, expect } from "vitest";
import { hasRequiredRole } from "../utils/roleRank";

describe("hasRequiredRole", () => {
  it("allows anyone (including anonymous) when required is null", () => {
    expect(hasRequiredRole(undefined, null)).toBe(true);
    expect(hasRequiredRole("USER", null)).toBe(true);
  });

  it("allows anyone (including anonymous) when required is undefined", () => {
    expect(hasRequiredRole(undefined, undefined)).toBe(true);
    expect(hasRequiredRole("USER", undefined)).toBe(true);
  });

  it("rejects an anonymous requester when a role is required", () => {
    expect(hasRequiredRole(undefined, "PREMIUM")).toBe(false);
  });

  it("PREMIUM requirement is satisfied by PREMIUM, MODERATOR, ADMIN but not USER", () => {
    expect(hasRequiredRole("USER", "PREMIUM")).toBe(false);
    expect(hasRequiredRole("PREMIUM", "PREMIUM")).toBe(true);
    expect(hasRequiredRole("MODERATOR", "PREMIUM")).toBe(true);
    expect(hasRequiredRole("ADMIN", "PREMIUM")).toBe(true);
  });

  it("ADMIN requirement is satisfied only by ADMIN", () => {
    expect(hasRequiredRole("MODERATOR", "ADMIN")).toBe(false);
    expect(hasRequiredRole("ADMIN", "ADMIN")).toBe(true);
  });

  it("USER requirement is satisfied by any authenticated role", () => {
    expect(hasRequiredRole("USER", "USER")).toBe(true);
    expect(hasRequiredRole("PREMIUM", "USER")).toBe(true);
    expect(hasRequiredRole(undefined, "USER")).toBe(false);
  });
});
