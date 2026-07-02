import { describe, it, expect, beforeEach } from "vitest";
import {
  registerValidator,
  getValidator,
  hasValidator,
  clearValidators,
} from "../registry/validatorRegistry";
import type { CardValidator } from "../types";

const pass: CardValidator = () => ({ isCorrect: true });

describe("validatorRegistry", () => {
  beforeEach(() => clearValidators());

  it("registers and retrieves a validator by type", () => {
    registerValidator("Foo", pass);
    expect(getValidator("Foo")).toBe(pass);
    expect(hasValidator("Foo")).toBe(true);
  });

  it("returns undefined for an unregistered type (auto-pass path)", () => {
    expect(getValidator("Nope")).toBeUndefined();
    expect(hasValidator("Nope")).toBe(false);
  });
});
