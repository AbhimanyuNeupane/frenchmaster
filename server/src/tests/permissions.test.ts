import { describe, it, expect } from "vitest";
import { hasPermission } from "../utils/permissions";

describe("hasPermission", () => {
  it("allows anyone (including anonymous) when required is null", () => {
    expect(hasPermission(undefined, null)).toBe(true);
    expect(hasPermission([], null)).toBe(true);
  });

  it("allows anyone (including anonymous) when required is undefined", () => {
    expect(hasPermission(undefined, undefined)).toBe(true);
    expect(hasPermission([], undefined)).toBe(true);
  });

  it("rejects an anonymous requester when a permission is required", () => {
    expect(hasPermission(undefined, "content.premium.access")).toBe(false);
  });

  it("rejects a requester whose permission set doesn't include the required key", () => {
    expect(hasPermission([], "content.premium.access")).toBe(false);
    expect(hasPermission(["users.manage"], "content.premium.access")).toBe(false);
  });

  it("accepts a requester whose permission set includes the required key", () => {
    expect(hasPermission(["content.premium.access"], "content.premium.access")).toBe(true);
    expect(hasPermission(["users.manage", "content.premium.access"], "content.premium.access")).toBe(true);
  });
});
