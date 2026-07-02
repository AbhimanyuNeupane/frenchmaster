import type * as React from "react";
import type { CardComponent } from "../types";

/**
 * Component registry — a plain Map keyed by card `type` string.
 *
 * This is the plugin mechanism: a card type becomes renderable purely by
 * calling `registerCardComponent` (a side effect performed at module scope in
 * each card file). The renderer only ever calls `getCardComponent` and never
 * references a concrete card type name. An unregistered type resolves to
 * `undefined`, which the renderer treats as the Unknown-Card fallback — never a
 * crash.
 *
 * The stored value may be a `React.lazy` component (a lazy-loading thunk), which
 * the renderer wraps in `<Suspense>`. No React rendering happens in this file.
 */
export type RegisteredComponent =
  | CardComponent
  | React.LazyExoticComponent<CardComponent>;

const registry = new Map<string, RegisteredComponent>();

export function registerCardComponent(
  type: string,
  component: RegisteredComponent
): void {
  registry.set(type, component);
}

export function getCardComponent(
  type: string
): RegisteredComponent | undefined {
  return registry.get(type);
}

export function hasCardComponent(type: string): boolean {
  return registry.has(type);
}

export function registeredCardTypes(): string[] {
  return [...registry.keys()];
}

/** Test-only: reset the registry between isolated unit tests. */
export function clearCardComponents(): void {
  registry.clear();
}
