import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContainer, onFinanceChanged, type HomeSummary } from '@stella-founds/core';
import { logError } from '../../lib/logError';

export interface DashboardSummaryState {
  summary: HomeSummary | null;
  /** True only for the very first fetch — nothing to show yet, render a skeleton. */
  isLoading: boolean;
  /** True for every fetch after the first — stale data is still on screen, refreshing quietly underneath it. */
  isRefreshing: boolean;
  error: Error | null;
  reload: () => void;
}

/** Same HomeSummaryService Android uses — only the storage underneath differs (IndexedDB either way, see createContainer). */
export function useDashboardSummary(): DashboardSummaryState {
  const { homeSummaryService } = useAppContainer();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = useRef(false);
  const cancelledRef = useRef(false);

  const load = useCallback(() => {
    if (hasLoadedOnce.current) setIsRefreshing(true);
    else setIsLoading(true);

    homeSummaryService
      .getSummary()
      .then((result) => {
        if (cancelledRef.current) return;
        setSummary(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelledRef.current) return;
        logError('useDashboardSummary', err);
        setError(err instanceof Error ? err : new Error('Failed to load dashboard summary'));
      })
      .finally(() => {
        if (cancelledRef.current) return;
        hasLoadedOnce.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, [homeSummaryService]);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelledRef.current = true;
      unsubscribe();
    };
  }, [load]);

  return { summary, isLoading, isRefreshing, error, reload: load };
}
