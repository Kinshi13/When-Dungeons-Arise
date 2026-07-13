import { useEffect, useState } from 'react';
import { useAppContainer } from '../../core/AppContainerContext';
import { onFinanceChanged } from '../../core/events';
import type { HomeSummary } from '../../core/services';

export function useHomeSummary() {
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
