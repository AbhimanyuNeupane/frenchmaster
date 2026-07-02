"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiPublic, ApiRequestError } from "@/lib/api-client";
import type { Language } from "@/types/language";

/**
 * The public enabled-languages list (`GET /api/languages`) is small, rarely
 * changes, and is needed in several places at once (signup, settings, learner
 * vocabulary + lesson native-translation labels). We fetch it once per page
 * load and share the result via a module-level cache so every consumer of
 * `useLanguages()` reuses the same request rather than firing its own.
 */
let cache: Language[] | null = null;
let inflight: Promise<Language[]> | null = null;

function loadLanguages(): Promise<Language[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = apiPublic<Language[]>("/api/languages")
      .then((data) => {
        cache = data;
        inflight = null;
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

interface UseLanguagesResult {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
}

export function useLanguages(): UseLanguagesResult {
  const [languages, setLanguages] = useState<Language[]>(cache ?? []);
  const [isLoading, setIsLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Always resolve through the promise (Promise.resolve(cache) when cached),
    // so state is only ever set from the async callback — never synchronously
    // in the effect body. When cached, `isLoading` already initialized false,
    // so there's no loading flash.
    loadLanguages()
      .then((data) => {
        if (active) {
          setLanguages(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiRequestError ? err.message : "Failed to load languages.");
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { languages, isLoading, error };
}

/**
 * Returns a stable `(code) => Language | undefined` lookup over the enabled
 * languages — used to pair a bare `languageCode` (e.g. on a word's
 * `nativeTranslation`) with its display name / flag emoji.
 */
export function useLanguageLookup(): (code: string) => Language | undefined {
  const { languages } = useLanguages();
  const map = useMemo(() => new Map(languages.map((l) => [l.code, l])), [languages]);
  return useCallback((code: string) => map.get(code), [map]);
}
