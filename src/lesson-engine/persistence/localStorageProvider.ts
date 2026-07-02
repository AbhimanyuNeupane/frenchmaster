import type { PersistenceProvider } from "../types";

/**
 * localStorage-backed persistence. SSR-safe: every method no-ops when `window`
 * is undefined. Swap this for an ApiPersistenceProvider (debounced POST to a
 * sync endpoint) later — the store and attachPersistence don't change.
 */
export class LocalStorageProvider implements PersistenceProvider {
  private get storage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  async save(key: string, state: unknown): Promise<void> {
    this.storage?.setItem(key, JSON.stringify(state));
  }

  async load<T>(key: string): Promise<T | null> {
    const raw = this.storage?.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async clear(key: string): Promise<void> {
    this.storage?.removeItem(key);
  }
}
