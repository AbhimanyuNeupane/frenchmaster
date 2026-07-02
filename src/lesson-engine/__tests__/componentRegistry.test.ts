import { describe, it, expect, beforeEach } from "vitest";
import {
  registerCardComponent,
  getCardComponent,
  hasCardComponent,
  registeredCardTypes,
  clearCardComponents,
} from "../registry/componentRegistry";

const Dummy = () => null;

describe("componentRegistry", () => {
  beforeEach(() => clearCardComponents());

  it("registers and retrieves a component by type", () => {
    registerCardComponent("Foo", Dummy);
    expect(getCardComponent("Foo")).toBe(Dummy);
    expect(hasCardComponent("Foo")).toBe(true);
  });

  it("returns undefined for an unregistered type (Unknown-Card path)", () => {
    expect(getCardComponent("Nope")).toBeUndefined();
    expect(hasCardComponent("Nope")).toBe(false);
  });

  it("lists all registered types", () => {
    registerCardComponent("A", Dummy);
    registerCardComponent("B", Dummy);
    expect(registeredCardTypes().sort()).toEqual(["A", "B"]);
  });

  it("last registration wins for the same type", () => {
    const Other = () => null;
    registerCardComponent("Foo", Dummy);
    registerCardComponent("Foo", Other);
    expect(getCardComponent("Foo")).toBe(Other);
  });
});
