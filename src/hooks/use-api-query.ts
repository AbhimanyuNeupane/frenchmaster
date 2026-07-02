"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";

interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches `path` via the authenticated session and re-fetches whenever
 * `deps` change. Intended for page-level GET requests against the backend.
 */
export function useApiQuery<T>(path: string, deps: unknown[] = []): UseApiQueryResult<T> {
  const { authedFetch } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authedFetch<T>(path);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, refetchIndex, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: () => setRefetchIndex((i) => i + 1) };
}
