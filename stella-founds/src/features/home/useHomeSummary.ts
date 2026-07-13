import { useEffect, useState } from 'react';
import { useAppContainer } from '../../core/AppContainerContext';
import type { HomeSummary } from '../../core/services';

export function useHomeSummary() {
  const { homeSummaryService } = useAppContainer();
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    homeSummaryService.getSummary().then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => {
      cancelled = true;
    };
  }, [homeSummaryService]);

  return summary;
}
