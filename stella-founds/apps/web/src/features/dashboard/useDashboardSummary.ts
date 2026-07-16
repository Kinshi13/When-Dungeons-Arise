import { useEffect, useState } from 'react';
import { useAppContainer, onFinanceChanged, type HomeSummary } from '@stella-founds/core';

/** Same HomeSummaryService Android uses — only the storage underneath differs (fake vs IndexedDB). */
export function useDashboardSummary() {
  const { homeSummaryService } = useAppContainer();
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      homeSummaryService.getSummary().then((result) => {
        if (!cancelled) setSummary(result);
      });
    }
    load();
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [homeSummaryService]);

  return summary;
}
