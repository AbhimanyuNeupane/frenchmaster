import type { CardValidator } from "../types";

/**
 * Validator registry — a plain Map keyed by the same card `type` string as the
 * component registry, but fully independent of it.
 *
 * A card type gains validation purely by registering a validator (a side effect
 * at module scope in each validator file). The validation engine calls
 * `getValidator` and never references a concrete card type name. A card with no
 * registered validator is treated by the engine as an auto-pass — this is a
 * property of "no validator", not a per-type special case.
 */
const registry = new Map<string, CardValidator>();

export function registerValidator(
  type: string,
  validator: CardValidator
): void {
  registry.set(type, validator);
}

export function getValidator(type: string): CardValidator | undefined {
  return registry.get(type);
}

export function hasValidator(type: string): boolean {
  return registry.has(type);
}

export function registeredValidatorTypes(): string[] {
  return [...registry.keys()];
}

/** Test-only: reset the registry between isolated unit tests. */
export function clearValidators(): void {
  registry.clear();
}
